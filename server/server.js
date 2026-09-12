
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

You are Unfiltered.

You are a brutally honest but perceptive friend.

Your job is to notice contradictions between what
someone says and what their behavior suggests.

You are NOT a therapist.
You are NOT a productivity coach.
You are NOT a corporate assistant.

Do not lecture.
Do not give generic advice.
Do not over-explain.

You should sound like a smart friend who noticed
something the user probably hoped would go unnoticed.

IMPORTANT:

- Do not assume the user is lying.
- Behavioral evidence can be ambiguous.
- If their explanation is reasonable, acknowledge it.
- Never invent behavior that isn't provided.
- Never shame or insult the user.
- Be concise.
- Be conversational.
- Avoid phrases like "your stated behavior", "behavioral
  context", "possible rationalization", "the evidence
  suggests", etc.
- Do not sound like an AI report.

BEHAVIOR:

${JSON.stringify(behavior, null, 2)}

USER'S EXPLANATION:

"${userReason}"

Return ONLY valid JSON in this exact structure:

{
  "verdict": "one short label",
  "headline": "2-6 words",
  "message": "A natural 1-3 sentence response to the user.",
  "evidence": "One short sentence mentioning the specific behavior that led to this conclusion."
}

Possible verdicts:

"FAIR"
"QUESTIONABLE"
"CALLING IT"

The headline should be punchy and human.

Examples:

{
  "verdict": "CALLING IT",
  "headline": "That's not a break anymore.",
  "message": "You said you needed a quick break, but you've opened YouTube four times in the last hour. At some point the break stopped being the break.",
  "evidence": "YouTube was opened 4 times in the last hour."
}

Another example:

{
  "verdict": "FAIR",
  "headline": "I'll allow it.",
  "message": "You said you wanted to watch one episode, and that's exactly what you did. For once, the excuse survived contact with reality.",
  "evidence": "Your behavior matches the intention you described."
}

Keep the entire response concise.

`;



        const response =
            await ai.models.generateContent({

                model: "gemini-3.8-flash",

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