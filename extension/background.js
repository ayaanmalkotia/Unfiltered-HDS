
const VISIT_THRESHOLD = 4;
const TIME_WINDOW = 60 * 60 * 1000; // 1 hour


chrome.tabs.onActivated.addListener(async (activeInfo) => {

    try {

        const tab = await chrome.tabs.get(activeInfo.tabId);

        if (!tab.url) return;

        recordDomainVisit(tab.url);

    } catch (error) {

        console.error("Error getting tab:", error);

    }

});



chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete") return;

    if (!tab.url) return;

    recordDomainVisit(tab.url);

});



async function recordDomainVisit(url) {

    try {

        const parsedUrl = new URL(url);

        if (
            parsedUrl.protocol === "chrome:" ||
            parsedUrl.protocol === "edge:" ||
            parsedUrl.protocol === "about:"
        ) {
            return;
        }

        const domain = parsedUrl.hostname.replace(/^www\./, "");

        const data = await chrome.storage.local.get(["visits"]);

        let visits = data.visits || [];

        const now = Date.now();

        visits.push({
            domain: domain,
            timestamp: now
        });

        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

        visits = visits.filter(
            visit => visit.timestamp > sevenDaysAgo
        );

        await chrome.storage.local.set({
            visits: visits
        });

        checkForPattern(domain, visits);

    } catch (error) {

        console.error("Could not record visit:", error);

    }

}



async function checkForPattern(domain, visits) {

    const now = Date.now();

    const oneHourAgo = now - TIME_WINDOW;

    const recentVisits = visits.filter(visit =>
        visit.domain === domain &&
        visit.timestamp >= oneHourAgo
    );

    if (recentVisits.length >= VISIT_THRESHOLD) {

        await chrome.storage.local.set({

            currentTrigger: {
                domain: domain,
                visitsLastHour: recentVisits.length,
                timestamp: now
            }

        });

        chrome.action.setBadgeText({
            text: "!"
        });

        chrome.action.setBadgeBackgroundColor({
            color: "#ff4444"
        });

    }

}


chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.type === "GET_CONTEXT") {

            getContext().then(context => {

                sendResponse(context);

            });

            return true;
        }

        if (message.type === "CLEAR_BADGE") {

            chrome.action.setBadgeText({
                text: ""
            });

        }

    }
);



async function getContext() {

    const data = await chrome.storage.local.get([
        "visits",
        "currentTrigger"
    ]);

    const visits = data.visits || [];

    const now = Date.now();

    const oneHourAgo = now - TIME_WINDOW;

    const recentVisits = visits.filter(
        visit => visit.timestamp >= oneHourAgo
    );

    const domainCounts = {};

    recentVisits.forEach(visit => {

        if (!domainCounts[visit.domain]) {
            domainCounts[visit.domain] = 0;
        }

        domainCounts[visit.domain]++;

    });

    return {

        currentTrigger: data.currentTrigger || null,

        visitsLastHour: recentVisits.length,

        domainCounts: domainCounts,

        timestamp: now

    };

}