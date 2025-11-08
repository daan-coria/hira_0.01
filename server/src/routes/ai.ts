import express from "express"
import fetch from "node-fetch"

const router = express.Router()

router.post("/ask", async (req, res) => {
  try {
    const { question, frontendData } = req.body

    const prompt = `
    You are an analytics assistant for a healthcare staffing tool.
    Use this JSON data to answer the question as accurately as possible:

    Data:
    ${JSON.stringify(frontendData, null, 2)}

    Question: "${question}"
    Answer concisely and use only the provided data.
    `

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content ?? "No response."

    res.json({ answer })
  } catch (error) {
    console.error("AI route error:", error)
    res.status(500).json({ error: "Failed to get AI response." })
  }
})

export default router
