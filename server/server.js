
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    GoogleGenAI
} = require("@google/genai");


const app = express();



app.use(cors());

app.use(express.json());



const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});



app.post("/analyze", async (req, res) => {

    try {

        const {
            behavior,
            userReason
        } = req.body;


        if (!userReason) {

            return res.status(400).json({
                error: "User reasoning is required."
            });

        }


        const prompt = `

You are UNFILTERED.

You are a behavioral reflection AI.

Your job is NOT to blindly agree with the user.

Your job is to examine the gap between:

1. What the user says
2. What their observed behavior suggests

You should identify possible rationalization,
but you must NOT assume the user is lying.

You must distinguish between:

- reasonable explanation
- possible rationalization
- strong behavioral inconsistency

IMPORTANT RULES:

- Never invent facts.
- Never claim certainty when evidence is weak.
- Do not shame the user.
- Be direct.
- Be concise.
- Do not give generic productivity advice.
- Use the actual behavioral data.
- If the user's reasoning is reasonable, say so.
- Your job is honesty, not negativity.

---------------------------------------
BEHAVIORAL CONTEXT
---------------------------------------

${JSON.stringify(behavior, null, 2)}

---------------------------------------
USER'S EXPLANATION
---------------------------------------

"${userReason}"

---------------------------------------
TASK
---------------------------------------

Analyze the user's explanation against
their observed behavior.

Return:

1. Assessment
2. Reasoning
3. A short direct response to the user

Keep the final response under 100 words.

The final response should sound like
a very perceptive friend who knows the
user's behavioral context and isn't afraid
to point out inconsistencies.

`;



        const response =
            await ai.models.generateContent({

                model: "gemini-2.5-flash",

                contents: prompt

            });


        const text =
            response.text;


        res.json({

            response: text

        });


    } catch (error) {

        console.error(
            "Gemini error:",
            error
        );


        res.status(500).json({

            error:
                "Failed to analyze behavior."

        });

    }

});


app.get("/", (req, res) => {

    res.json({

        status: "Unfiltered backend running"

    });

});

const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `Unfiltered server running on http://localhost:${PORT}`
    );

});