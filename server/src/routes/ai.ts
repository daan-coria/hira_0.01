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
    // Extract snapshot using REAL structure
    // --------------------------------------
    const healthSystem = snapshot?.healthSystem ?? {};

    const facilitySummary = snapshot?.facilitySummary ?? {};

    const shifts = Array.isArray(snapshot?.shifts) ? snapshot.shifts : [];

    const resourceInput = Array.isArray(snapshot?.resourceInput)
      ? snapshot.resourceInput
      : [];
      
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
You help the user understand their hospital configuration and provide insights on:

- Health System Setup (regions, campuses)
- Facility Summary
- Shift Configuration
- Resource Input (employees roster)

Below is the full data the user currently has loaded in the tool.

-------------------------------------------------------
📌 REGIONS
-------------------------------------------------------
${JSON.stringify(regions, null, 2)}

-------------------------------------------------------
📌 CAMPUSES
-------------------------------------------------------
${JSON.stringify(campuses, null, 2)}

-------------------------------------------------------
📌 FACILITY SUMMARY
-------------------------------------------------------
${JSON.stringify(facilitySummary, null, 2)}

-------------------------------------------------------
📌 SHIFTS
-------------------------------------------------------
${JSON.stringify(shifts, null, 2)}

-------------------------------------------------------
📌 RESOURCE INPUT
Only includes trimmed fields: names, job, FTE, shift group, weekend group, start/end, cost center.
-------------------------------------------------------
${JSON.stringify(resourceInput, null, 2)}

-------------------------------------------------------
📌 TOOL TYPE:
${toolType}

📌 CURRENT STEP:
${currentStep}
-------------------------------------------------------

🎯 **INSTRUCTIONS FOR THE AI**
- Answer the user's question using ONLY the data above.
- If the answer cannot be found with the available data, say so politely.
- If the user asks for counts (e.g., “How many RNs on night shift?”), calculate them.
- If the user asks for lists (e.g., “Show me all employees in weekend group B”), return them in a clear table-like format.
- Do NOT invent hospitals, staffing, shifts, or employees not found in the snapshot.
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
