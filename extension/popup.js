// ============================================
// UNFILTERED POPUP
// ============================================

const contextText =
    document.getElementById("contextText");

const reasonInput =
    document.getElementById("reason");

const submitButton =
    document.getElementById("submitButton");

const loading =
    document.getElementById("loading");

const responseContainer =
    document.getElementById("responseContainer");

const responseElement =
    document.getElementById("response");


// --------------------------------------------
// Get behavioral context when popup opens
// --------------------------------------------

chrome.runtime.sendMessage(
    {
        type: "GET_CONTEXT"
    },

    (context) => {

        if (!context) {

            contextText.textContent =
                "I couldn't detect enough behavioral context.";

            return;

        }

        displayContext(context);

    }
);


// --------------------------------------------
// Display context
// --------------------------------------------

function displayContext(context) {

    const trigger = context.currentTrigger;

    if (trigger) {

        contextText.textContent =
            `You've visited ${trigger.domain} ${trigger.visitsLastHour} times in the last hour.`;

    } else {

        contextText.textContent =
            `You've visited ${context.visitsLastHour} pages in the last hour.`;

    }

}


// --------------------------------------------
// Submit reasoning
// --------------------------------------------

submitButton.addEventListener(
    "click",
    async () => {

        const reason =
            reasonInput.value.trim();

        if (!reason) {

            reasonInput.focus();

            return;

        }


        submitButton.disabled = true;

        loading.classList.remove("hidden");

        responseContainer.classList.add("hidden");


        try {

            const context =
                await getContext();


            const result =
                await fetch(
                    "http://localhost:3000/analyze",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            behavior: context,

                            userReason: reason

                        })

                    }
                );


            if (!result.ok) {

                throw new Error(
                    "Server returned an error"
                );

            }


            const data =
                await result.json();


            responseElement.textContent =
                data.response;


            responseContainer.classList.remove(
                "hidden"
            );


        } catch (error) {

            console.error(error);

            responseElement.textContent =
                "Something went wrong connecting to Unfiltered.";

            responseContainer.classList.remove(
                "hidden"
            );

        } finally {

            loading.classList.add("hidden");

            submitButton.disabled = false;

        }


        // Remove badge
        chrome.runtime.sendMessage({
            type: "CLEAR_BADGE"
        });

    }
);


// --------------------------------------------
// Get context from background
// --------------------------------------------

function getContext() {

    return new Promise((resolve) => {

        chrome.runtime.sendMessage(
            {
                type: "GET_CONTEXT"
            },

            (response) => {

                resolve(response);

            }
        );

    });

}