import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/ask", async (req, res) => {
  try {
    const { question, snapshot } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Missing question." });
    }

    // --------------------------------------
    // 🔥 FIX: Extract snapshot using your REAL structure
    // --------------------------------------
    const healthSystem = snapshot?.healthSystem ?? {};
    const facilitySummary = snapshot?.facilitySummary ?? {};
    const shifts = Array.isArray(snapshot?.shifts) ? snapshot.shifts : [];

    const regions = Array.isArray(healthSystem.regions)
      ? healthSystem.regions
      : [];

    const campuses = Array.isArray(healthSystem.campuses)
      ? healthSystem.campuses
      : [];

    const toolType = snapshot?.toolType ?? "IP";
    const currentStep = snapshot?.currentStep ?? null;

    // --------------------------------------
    // Build the prompt for OpenAI
    // --------------------------------------
    const systemPrompt = `
You are the HIRA AI Assistant. 
You help the user understand their hospital configuration.

Here is the structured data from the frontend:

REGIONS:
${JSON.stringify(regions, null, 2)}

CAMPUSES:
${JSON.stringify(campuses, null, 2)}

FACILITY SUMMARY:
${JSON.stringify(facilitySummary, null, 2)}

SHIFTS:
${JSON.stringify(shifts, null, 2)}

TOOL TYPE: ${toolType}
CURRENT STEP: ${currentStep}

Answer the user's question using ONLY this data.
If something is missing, say so politely.
    `;

    // --------------------------------------
    // Call OpenAI
    // --------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content ?? "";

    return res.json({ answer });
  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ error: "AI processing failed." });
  }
});

export default router;
