import { Router, Request, Response } from "express"
const router = Router()

// POST /api/v1/ai/ask — main endpoint used by your AIAgent
router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { question, frontendData } = req.body

    if (!question) {
      return res.status(400).json({ error: "Missing 'question' in request body." })
    }

    // Example response (replace later with OpenAI logic)
    const answer = `You asked: "${question}". The frontend has ${Object.keys(frontendData || {}).length} data categories.`

    res.json({ answer })
  } catch (err) {
    console.error("AI route error:", err)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Optional: health test for GET
router.get("/", (_, res: Response) => {
  res.send("AI route active ✅ — use POST /api/v1/ai/ask")
})

export default router
