// ============================================
// ELEMENTS
// ============================================

const mainView =
    document.getElementById("mainView");

const logsView =
    document.getElementById("logsView");

const ledgerView =
    document.getElementById("ledgerView");

const gateView =
    document.getElementById("gateView");


const logsButton =
    document.getElementById("logsButton");

const ledgerButton =
    document.getElementById("ledgerButton");


const backFromLogs =
    document.getElementById("backFromLogs");

const backFromLedger =
    document.getElementById("backFromLedger");


const siteSignal =
    document.getElementById("siteSignal");

const siteDomain =
    document.getElementById("siteDomain");

const siteCount =
    document.getElementById("siteCount");


const reasonInput =
    document.getElementById("reasonInput");

const analyzeButton =
    document.getElementById("analyzeButton");


const responseCard =
    document.getElementById("responseCard");

const verdict =
    document.getElementById("verdict");

const responseHeadline =
    document.getElementById(
        "responseHeadline"
    );

const responseMessage =
    document.getElementById(
        "responseMessage"
    );

const responseEvidence =
    document.getElementById(
        "responseEvidence"
    );


const logsList =
    document.getElementById("logsList");


const ledgerList =
    document.getElementById("ledgerList");


// Gate
const gateDomain =
    document.getElementById("gateDomain");

const gateCount =
    document.getElementById("gateCount");

const gateReason =
    document.getElementById("gateReason");

const gateAnalyze =
    document.getElementById("gateAnalyze");

const continueButton =
    document.getElementById(
        "continueButton"
    );

const gateResponse =
    document.getElementById(
        "gateResponse"
    );

const gateVerdict =
    document.getElementById(
        "gateVerdict"
    );

const gateHeadline =
    document.getElementById(
        "gateHeadline"
    );

const gateMessage =
    document.getElementById(
        "gateMessage"
    );

const gateEvidence =
    document.getElementById(
        "gateEvidence"
    );

const acknowledgeButton =
    document.getElementById(
        "acknowledgeButton"
    );


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    if (
        params.get("gate") === "true"
    ) {

        await showGate();

        return;

    }


    await loadContext();

}


// ============================================
// LOAD CONTEXT
// ============================================

async function loadContext() {

    chrome.runtime.sendMessage(

        {
            type: "GET_CONTEXT"
        },

        context => {

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    chrome.runtime.lastError
                );

                return;

            }


            displayContext(context);

        }

    );

}


// ============================================
// DISPLAY CONTEXT
// ============================================

function displayContext(context) {

    const trigger =
        context.currentTrigger;


    if (!trigger) {

        siteSignal.classList.add(
            "hidden"
        );

        return;

    }


    siteSignal.classList.remove(
        "hidden"
    );


    siteDomain.textContent =
        trigger.domain.toUpperCase();


    siteCount.textContent =
        `${trigger.visitsLastHour} visits`;

}


// ============================================
// NORMAL ANALYSIS
// ============================================

analyzeButton.addEventListener(
    "click",
    analyzeNormal
);


async function analyzeNormal() {

    const reason =
        reasonInput.value.trim();


    if (!reason) {

        reasonInput.focus();

        return;

    }


    analyzeButton.disabled = true;

    analyzeButton.textContent =
        "CHECKING...";


    try {

        const context =
            await getContext();


        const result =
            await sendToGemini({

                behavior:
                    context,

                userReason:
                    reason

            });


        displayResponse(result);


    } catch (error) {

        console.error(error);

        responseCard.classList.remove(
            "hidden"
        );

        responseHeadline.textContent =
            "Something went wrong.";

        responseMessage.textContent =
            "Unfiltered couldn't reach the analysis server.";

    }


    analyzeButton.disabled = false;

    analyzeButton.textContent =
        "CHECK ME";

}


// ============================================
// GEMINI REQUEST
// ============================================

async function sendToGemini(payload) {

    const response =
        await fetch(
            "http://localhost:3000/analyze",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    if (!response.ok) {

        throw new Error(
            "Server returned " +
            response.status
        );

    }


    return await response.json();

}


// ============================================
// DISPLAY NORMAL RESPONSE
// ============================================

function displayResponse(data) {

    responseCard.classList.remove(
        "hidden"
    );


    verdict.textContent =
        data.verdict || "UNFILTERED";


    responseHeadline.textContent =
        data.headline || "";


    responseMessage.textContent =
        data.message || "";


    responseEvidence.textContent =
        data.evidence || "";

}


// ============================================
// GET CONTEXT PROMISE
// ============================================

function getContext() {

    return new Promise(resolve => {

        chrome.runtime.sendMessage(

            {
                type: "GET_CONTEXT"
            },

            response => {

                resolve(response);

            }

        );

    });

}


// ============================================
// LOGS
// ============================================

logsButton.addEventListener(
    "click",
    async () => {

        mainView.classList.add(
            "hidden"
        );

        logsView.classList.remove(
            "hidden"
        );

        await loadLogs();

    }
);


backFromLogs.addEventListener(
    "click",
    () => {

        logsView.classList.add(
            "hidden"
        );

        mainView.classList.remove(
            "hidden"
        );

    }
);


async function loadLogs() {

    chrome.runtime.sendMessage(

        {
            type: "GET_LOGS"
        },

        logs => {

            renderLogs(
                logs || []
            );

        }

    );

}


function renderLogs(logs) {

    logsList.innerHTML = "";


    if (!logs.length) {

        logsList.innerHTML =
            `<div class="ledger-intro">
                No activity recorded yet.
            </div>`;

        return;

    }


    logs.forEach(log => {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "log-item";


        const date =
            new Date(
                log.timestamp
            );


        item.innerHTML = `

            <div class="log-domain">
                ${escapeHTML(log.domain)}
            </div>

            <div class="log-details">

                <span>
                    ${formatDate(date)}
                </span>

                <span class="log-repeat">
                    ${log.visitsLastHour}
                    / hr
                </span>

            </div>

        `;


        logsList.appendChild(
            item
        );

    });

}


// ============================================
// LEDGER
// ============================================

ledgerButton.addEventListener(
    "click",
    async () => {

        mainView.classList.add(
            "hidden"
        );

        ledgerView.classList.remove(
            "hidden"
        );

        await loadLedger();

    }
);


backFromLedger.addEventListener(
    "click",
    () => {

        ledgerView.classList.add(
            "hidden"
        );

        mainView.classList.remove(
            "hidden"
        );

    }
);


async function loadLedger() {

    chrome.runtime.sendMessage(

        {
            type: "GET_LEDGER"
        },

        ledger => {

            renderLedger(
                ledger
            );

        }

    );

}


function renderLedger(ledger) {

    ledgerList.innerHTML = "";


    if (
        !ledger.entries ||
        !ledger.entries.length
    ) {

        ledgerList.innerHTML =
            `<div class="ledger-intro">
                Your calibration ledger will
                appear after you complete
                a few reflections.
            </div>`;

        return;

    }


    ledger.entries.forEach(
        entry => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "ledger-item";


            item.innerHTML = `

                <div class="ledger-domain">
                    ${escapeHTML(
                        entry.domain
                    )}
                </div>

                <div class="ledger-score">
                    ${entry.calibration}%
                </div>

                <div class="ledger-label">
                    INTENTION → OUTCOME
                </div>

                <div class="ledger-stats">

                    <span>
                        ${entry.held} held
                    </span>

                    <span>
                        ${entry.failed} ignored
                    </span>

                    <span>
                        ${entry.total} checks
                    </span>

                </div>

            `;


            ledgerList.appendChild(
                item
            );

        }
    );

}


// ============================================
// REFLECTION GATE
// ============================================

async function showGate() {

    mainView.classList.add(
        "hidden"
    );

    logsView.classList.add(
        "hidden"
    );

    ledgerView.classList.add(
        "hidden"
    );

    gateView.classList.remove(
        "hidden"
    );


    const context =
        await getContext();


    const trigger =
        context.currentTrigger;


    if (!trigger) {

        gateDomain.textContent =
            "NO SIGNAL";

        gateCount.textContent =
            "";

        return;

    }


    gateDomain.textContent =
        trigger.domain.toUpperCase();


    gateCount.textContent =
        `${trigger.visitsLastHour} visits`;

}


// ============================================
// GATE ANALYSIS
// ============================================

gateAnalyze.addEventListener(
    "click",
    analyzeGate
);


async function analyzeGate() {

    const reason =
        gateReason.value.trim();


    if (!reason) {

        gateReason.focus();

        return;

    }


    gateAnalyze.disabled = true;

    gateAnalyze.textContent =
        "LOOKING CLOSER...";


    try {

        const context =
            await getContext();


        const trigger =
            context.currentTrigger;


        const result =
            await sendToGemini({

                behavior: {

                    specificSite:
                        trigger
                            ? trigger.domain
                            : "unknown",

                    visitsLastHour:
                        trigger
                            ? trigger.visitsLastHour
                            : 0,

                    threshold:
                        trigger
                            ? trigger.threshold
                            : 4,

                    recentActivity:
                        context.recentActivity

                },

                userReason:
                    reason

            });


        displayGateResponse(
            result
        );


        await saveReflection({

            domain:
                trigger
                    ? trigger.domain
                    : "unknown",

            visitsLastHour:
                trigger
                    ? trigger.visitsLastHour
                    : 0,

            userReason:
                reason,

            verdict:
                result.verdict,

            headline:
                result.headline,

            message:
                result.message,

            evidence:
                result.evidence

        });


    } catch (error) {

        console.error(error);

        gateMessage.textContent =
            "Couldn't connect to Unfiltered.";

        gateResponse.classList.remove(
            "hidden"
        );

    }


    gateAnalyze.disabled = false;

    gateAnalyze.textContent =
        "LET'S BE HONEST";

}


function displayGateResponse(data) {

    gateResponse.classList.remove(
        "hidden"
    );


    gateVerdict.textContent =
        data.verdict || "";


    gateHeadline.textContent =
        data.headline || "";


    gateMessage.textContent =
        data.message || "";


    gateEvidence.textContent =
        data.evidence || "";

}


// ============================================
// SAVE REFLECTION
// ============================================

function saveReflection(reflection) {

    return new Promise(resolve => {

        chrome.runtime.sendMessage(

            {
                type:
                    "SAVE_REFLECTION",

                reflection:
                    reflection

            },

            response => {

                resolve(response);

            }

        );

    });

}


// ============================================
// ACKNOWLEDGE
// ============================================

acknowledgeButton.addEventListener(
    "click",
    async () => {

        const result =
            await chrome.storage.local.get(
                "reflections"
            );


        const reflections =
            result.reflections || [];


        const latest =
            reflections[0];


        if (latest) {

            await sendOutcome(
                latest.id,
                "HELD"
            );

        }


        await chrome.runtime.sendMessage({

            type:
                "CLEAR_BADGE"

        });


        acknowledgeButton.textContent =
            "RECORDED";


        acknowledgeButton.disabled =
            true;

    }
);


// ============================================
// CONTINUE ANYWAY
// ============================================

continueButton.addEventListener(
    "click",
    async () => {

        const result =
            await chrome.storage.local.get(
                "reflections"
            );


        const reflections =
            result.reflections || [];


        const latest =
            reflections[0];


        if (latest) {

            await sendOutcome(
                latest.id,
                "DID_IT_ANYWAY"
            );

        }


        await chrome.runtime.sendMessage({

            type:
                "CLEAR_BADGE"

        });


        window.close();

    }
);


// ============================================
// OUTCOME
// ============================================

function sendOutcome(
    id,
    outcome
) {

    return new Promise(resolve => {

        chrome.runtime.sendMessage(

            {

                type:
                    "UPDATE_OUTCOME",

                id:
                    id,

                outcome:
                    outcome

            },

            response => {

                resolve(response);

            }

        );

    });

}


// ============================================
// HELPERS
// ============================================

function formatDate(date) {

    return date.toLocaleString(
        [],
        {

            month: "short",

            day: "numeric",

            hour: "2-digit",

            minute: "2-digit"

        }
    );

}


function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}