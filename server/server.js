require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    GoogleGenAI
} = require("@google/genai");


const app =
    express();


app.use(cors());

app.use(
    express.json()
);


// ============================================
// GEMINI
// ============================================

const ai =
    new GoogleGenAI({

        apiKey:
            process.env.GEMINI_API_KEY

    });


// ============================================
// ANALYZE
// ============================================

app.post(
    "/analyze",
    async (req, res) => {

        try {

            const {
                behavior,
                userReason
            } = req.body;


            if (!userReason) {

                return res
                    .status(400)
                    .json({

                        error:
                            "User reasoning is required."

                    });

            }


            const prompt = `

You are Unfiltered.

You are a brutally honest but perceptive friend.

Your job is to notice contradictions between what
someone says and what their behavior suggests.

You are NOT a therapist.
You are NOT a productivity coach.
You are NOT a corporate assistant.

You should sound like a smart friend who noticed
something the user probably hoped would go unnoticed.

Do not lecture.
Do not give generic advice.
Do not over-explain.

IMPORTANT:

- Do not assume the user is lying.
- Behavioral evidence can be ambiguous.
- If the explanation is reasonable, acknowledge it.
- Never invent behavior.
- Never shame or insult the user.
- Be concise.
- Be conversational.
- Talk directly to the user.
- Do not sound like an AI report.
- Do not use phrases like "behavioral context".
- Do not use phrases like "the evidence suggests".
- Do not use phrases like "your stated behavior".

SPECIFIC SITE:

${behavior?.specificSite || "Unknown"}

VISITS IN LAST HOUR:

${behavior?.visitsLastHour || 0}

THRESHOLD:

${behavior?.threshold || 4}

RECENT ACTIVITY:

${JSON.stringify(
    behavior?.recentActivity || [],
    null,
    2
)}

USER'S EXPLANATION:

"${userReason}"


A repeated visit to the SAME site is especially important.

When a specific site has been opened repeatedly,
mention the site and the number of visits naturally.

Do NOT vaguely say:

"Your browsing behavior is concerning."

Instead say something like:

"You've opened YouTube six times in the last hour.
That makes 'just taking a quick break' a little harder
to sell."

The response should feel personal and conversational.

If the user's explanation actually makes sense,
say so.

Return ONLY valid JSON.

Use exactly:

{
    "verdict": "FAIR",
    "headline": "2-6 word human headline",
    "message": "1-3 natural sentences.",
    "evidence": "One short sentence using the specific evidence."
}

The verdict MUST be:

"FAIR"

or

"QUESTIONABLE"

or

"CALLING IT"


Do not put markdown in the JSON.

Keep the response concise.

`;


            const response =
                await ai.models.generateContent({

                    model:
                        "gemini-3.8-flash",

                    contents:
                        prompt,

                    config: {

                        responseMimeType:
                            "application/json"

                    }

                });


            const result =
                JSON.parse(
                    response.text
                );


            res.json(
                result
            );


        } catch (error) {

            console.error(
                "Gemini error:",
                error
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Failed to analyze behavior."

            });

        }

    }
);


// ============================================
// HEALTH CHECK
// ============================================

app.get(
    "/",
    (req, res) => {

        res.json({

            status:
                "Unfiltered backend running"

        });

    }
);


// ============================================
// SERVER
// ============================================

const PORT =
    3000;


app.listen(
    PORT,
    () => {

        console.log(
            `Unfiltered server running on http://localhost:${PORT}`
        );

    }
);