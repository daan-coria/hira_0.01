import express from "express"

const router = express.Router()

router.post("/ask", async (req, res) => {
  try {
    const { question, frontendData } = req.body

    const prompt = `
    You are an analytics assistant for a hospital staffing platform.
    Use ONLY the following JSON data to answer the question accurately:
    ${JSON.stringify(frontendData, null, 2)}

    Question: "${question}"
    Give a concise factual answer. If unknown, say "Not enough data".
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
