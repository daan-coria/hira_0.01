import { Router, Request, Response } from "express"
import OpenAI from "openai"

const router = Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ✅ Main AI endpoint: POST /api/v1/ai/ask
router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { question, frontendData } = req.body

    if (!question) {
      return res.status(400).json({ error: "Missing 'question' in request body." })
    }

    // Prepare context from the FE snapshot
    const snapshotSummary = Object.keys(frontendData || {})
      .map((key) => `${key}: ${Array.isArray(frontendData[key]) ? frontendData[key].length : typeof frontendData[key]}`)
      .join("\n")

    // Send to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are the AI assistant of the HIRA Staffing Tool. You help analyze healthcare staffing data, including shifts, FTEs, resources, and census projections.",
        },
        {
          role: "user",
          content: `Question: ${question}\n\nFrontend snapshot summary:\n${snapshotSummary}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 500,
    })

    const answer = completion.choices[0].message?.content || "⚠️ No response from AI."
    res.json({ answer })
  } catch (error: any) {
    console.error("AI route error:", error)
    res.status(500).json({
      error: "Failed to contact OpenAI API",
      details: error.message,
    })
  }
})

// Optional GET route for quick health check
router.get("/", (_, res) => {
  res.send("✅ AI route is active. Use POST /api/v1/ai/ask")
})

export default router
