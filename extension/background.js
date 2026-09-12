// ============================================
// UNFILTERED BACKGROUND SERVICE WORKER
// ============================================

const REPEAT_THRESHOLD = 4;
const WINDOW_MINUTES = 60;
const DEDUPLICATION_SECONDS = 10;

const MAX_LOGS = 200;
const MAX_REFLECTIONS = 100;


// ============================================
// TAB EVENT TRACKING
// ============================================

chrome.tabs.onActivated.addListener(async (activeInfo) => {

    try {

        const tab = await chrome.tabs.get(activeInfo.tabId);

        await recordVisit(tab);

    } catch (error) {

        console.error("Activation tracking error:", error);

    }

});


chrome.tabs.onUpdated.addListener(
    async (tabId, changeInfo, tab) => {

        if (changeInfo.status !== "complete") {
            return;
        }

        await recordVisit(tab);

    }
);


// ============================================
// RECORD VISIT
// ============================================

async function recordVisit(tab) {

    if (!tab || !tab.url) {
        return;
    }


    let url;

    try {

        url = new URL(tab.url);

    } catch {

        return;

    }


    // Only track normal websites
    if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
    ) {
        return;
    }


    const domain =
        url.hostname
            .replace(/^www\./, "")
            .toLowerCase();


    const now = Date.now();


    const data =
        await chrome.storage.local.get([
            "siteStats",
            "actionLogs",
            "tabState"
        ]);


    const siteStats =
        data.siteStats || {};

    const actionLogs =
        data.actionLogs || [];

    const tabState =
        data.tabState || {};



    // ========================================
    // DUPLICATE EVENT PROTECTION
    // ========================================

    const previous =
        tabState[tab.id];


    if (
        previous &&
        previous.domain === domain &&
        now - previous.timestamp <
        DEDUPLICATION_SECONDS * 1000
    ) {

        return;

    }


    tabState[tab.id] = {

        domain: domain,

        timestamp: now

    };



    // ========================================
    // SITE STATISTICS
    // ========================================

    if (!siteStats[domain]) {

        siteStats[domain] = {

            domain: domain,

            totalVisits: 0,

            timestamps: []

        };

    }


    siteStats[domain].totalVisits++;

    siteStats[domain].timestamps.push(now);



    // Keep only last 24 hours
    siteStats[domain].timestamps =
        siteStats[domain].timestamps.filter(
            timestamp =>
                now - timestamp <
                24 * 60 * 60 * 1000
        );



    // ========================================
    // LAST HOUR COUNT
    // ========================================

    const visitsLastHour =
        siteStats[domain].timestamps.filter(
            timestamp =>
                now - timestamp <=
                WINDOW_MINUTES * 60 * 1000
        ).length;



    // ========================================
    // LOG
    // ========================================

    const logEntry = {

        id:
            `${now}-${Math.random()
                .toString(36)
                .substring(2)}`,

        type: "SITE_VISIT",

        domain: domain,

        timestamp: now,

        visitsLastHour: visitsLastHour,

        totalVisitsToday:
            siteStats[domain].timestamps.length

    };


    actionLogs.unshift(logEntry);


    if (actionLogs.length > MAX_LOGS) {

        actionLogs.length = MAX_LOGS;

    }



    // ========================================
    // SAVE
    // ========================================

    await chrome.storage.local.set({

        siteStats: siteStats,

        actionLogs: actionLogs,

        tabState: tabState

    });



    // ========================================
    // THRESHOLD
    // ========================================

    if (visitsLastHour >= REPEAT_THRESHOLD) {

        await handleThreshold(
            domain,
            visitsLastHour
        );

    }

}


// ============================================
// HANDLE THRESHOLD
// ============================================

async function handleThreshold(
    domain,
    visitsLastHour
) {

    const data =
        await chrome.storage.local.get([
            "currentTrigger"
        ]);


    const currentTrigger =
        data.currentTrigger;



    // Don't repeatedly spam notifications
    // for the same site every single event.

    if (
        currentTrigger &&
        currentTrigger.domain === domain &&
        currentTrigger.visitsLastHour ===
            visitsLastHour &&
        Date.now() -
            currentTrigger.timestamp <
            5 * 60 * 1000
    ) {

        return;

    }



    const trigger = {

        domain: domain,

        visitsLastHour: visitsLastHour,

        timestamp: Date.now(),

        threshold: REPEAT_THRESHOLD

    };


    await chrome.storage.local.set({

        currentTrigger: trigger

    });



    // ========================================
    // BADGE
    // ========================================

    await chrome.action.setBadgeText({

        text:
            String(visitsLastHour)

    });


    await chrome.action.setBadgeBackgroundColor({

        color: "#ff3b3b"

    });



    // ========================================
    // NOTIFICATION
    // ========================================

    chrome.notifications.create(
        `unfiltered-${Date.now()}`,
        {

            type: "basic",

            iconUrl:
                chrome.runtime.getURL(
                    "finalicon.png"
                ),

            title:
                "UNFILTERED",

            message:
                `${domain.toUpperCase()} — ${visitsLastHour} visits in the last hour.`,

            priority: 2,

            buttons: [
                {
                    title: "Reflect"
                }
            ]

        }
    );

}


// ============================================
// NOTIFICATION CLICK
// ============================================

chrome.notifications.onClicked.addListener(
    async (notificationId) => {

        await openReflectionGate();

        chrome.notifications.clear(
            notificationId
        );

    }
);


chrome.notifications.onButtonClicked.addListener(
    async (
        notificationId,
        buttonIndex
    ) => {

        if (buttonIndex === 0) {

            await openReflectionGate();

        }

        chrome.notifications.clear(
            notificationId
        );

    }
);


// ============================================
// OPEN REFLECTION GATE
// ============================================

async function openReflectionGate() {

    const url =
        chrome.runtime.getURL(
            "popup.html?gate=true"
        );


    await chrome.tabs.create({

        url: url

    });

}


// ============================================
// MESSAGE HANDLER
// ============================================

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {


        if (message.type === "GET_CONTEXT") {

            getContext()
                .then(sendResponse);

            return true;

        }


        if (message.type === "GET_LOGS") {

            getLogs()
                .then(sendResponse);

            return true;

        }


        if (message.type === "GET_LEDGER") {

            getLedger()
                .then(sendResponse);

            return true;

        }


        if (message.type === "SAVE_REFLECTION") {

            saveReflection(
                message.reflection
            )
            .then(sendResponse);

            return true;

        }


        if (message.type === "UPDATE_OUTCOME") {

            updateOutcome(
                message.id,
                message.outcome
            )
            .then(sendResponse);

            return true;

        }


        if (message.type === "CLEAR_BADGE") {

            chrome.action.setBadgeText({

                text: ""

            });

        }

    }
);


// ============================================
// CONTEXT
// ============================================

async function getContext() {

    const data =
        await chrome.storage.local.get([
            "currentTrigger",
            "siteStats"
        ]);


    const trigger =
        data.currentTrigger || null;


    const recentActivity = [];


    if (data.siteStats) {

        const now = Date.now();


        Object.values(
            data.siteStats
        ).forEach(site => {

            const visitsLastHour =
                site.timestamps.filter(
                    timestamp =>
                        now - timestamp <=
                        60 * 60 * 1000
                ).length;


            if (visitsLastHour > 0) {

                recentActivity.push({

                    domain:
                        site.domain,

                    visitsLastHour:
                        visitsLastHour,

                    totalVisits:
                        site.totalVisits

                });

            }

        });

    }


    recentActivity.sort(
        (a, b) =>
            b.visitsLastHour -
            a.visitsLastHour
    );


    return {

        currentTrigger:
            trigger,

        recentActivity:
            recentActivity

    };

}


// ============================================
// LOGS
// ============================================

async function getLogs() {

    const data =
        await chrome.storage.local.get(
            "actionLogs"
        );


    return data.actionLogs || [];

}


// ============================================
// SAVE REFLECTION
// ============================================

async function saveReflection(
    reflection
) {

    const data =
        await chrome.storage.local.get(
            "reflections"
        );


    const reflections =
        data.reflections || [];


    reflections.unshift({

        ...reflection,

        id:
            reflection.id ||
            `${Date.now()}-${Math.random()}`,

        timestamp:
            reflection.timestamp ||
            Date.now(),

        outcome:
            "PENDING"

    });


    if (
        reflections.length >
        MAX_REFLECTIONS
    ) {

        reflections.length =
            MAX_REFLECTIONS;

    }


    await chrome.storage.local.set({

        reflections:

            reflections

    });


    return {

        success: true

    };

}


// ============================================
// UPDATE OUTCOME
// ============================================

async function updateOutcome(
    id,
    outcome
) {

    const data =
        await chrome.storage.local.get(
            "reflections"
        );


    const reflections =
        data.reflections || [];


    const reflection =
        reflections.find(
            item =>
                item.id === id
        );


    if (!reflection) {

        return {

            success: false,

            error:
                "Reflection not found."

        };

    }


    reflection.outcome =
        outcome;

    reflection.outcomeTimestamp =
        Date.now();


    await chrome.storage.local.set({

        reflections:
            reflections

    });


    return {

        success: true

    };

}


// ============================================
// CALIBRATION LEDGER
// ============================================

async function getLedger() {

    const data =
        await chrome.storage.local.get(
            "reflections"
        );


    const reflections =
        data.reflections || [];


    const completed =
        reflections.filter(
            reflection =>
                reflection.outcome !==
                "PENDING"
        );


    const ledger = {};


    completed.forEach(
        reflection => {

            const domain =
                reflection.domain;


            if (!ledger[domain]) {

                ledger[domain] = {

                    domain: domain,

                    total: 0,

                    held: 0,

                    failed: 0

                };

            }


            ledger[domain].total++;


            if (
                reflection.outcome ===
                "HELD"
            ) {

                ledger[domain].held++;

            }


            if (
                reflection.outcome ===
                "DID_IT_ANYWAY"
            ) {

                ledger[domain].failed++;

            }

        }
    );


    Object.values(ledger)
        .forEach(item => {

            item.calibration =
                item.total > 0
                    ? Math.round(
                        (
                            item.held /
                            item.total
                        ) * 100
                    )
                    : 0;

        });


    return {

        entries:
            Object.values(ledger),

        totalReflections:
            reflections.length,

        completed:
            completed.length

    };

}