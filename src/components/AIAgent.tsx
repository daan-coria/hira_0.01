import { useState, useEffect, useMemo } from "react"
import { useApp } from "@/store/AppContext"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

export default function AIAgent() {
  const { getFrontendSnapshot } = useApp() // ✅ new helper from context
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [frontendData, setFrontendData] = useState<Record<string, any>>({})

  // 🧠 Keep the snapshot in sync automatically whenever context changes
  useEffect(() => {
    setFrontendData(getFrontendSnapshot())
  }, [getFrontendSnapshot]) // this re-runs whenever any context value updates

  // Optional: memoize to reduce unnecessary re-renders
  const jsonPayload = useMemo(
    () => JSON.stringify({ question, frontendData }),
    [question, frontendData]
  )

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)
    setAnswer("")

    try {
      const res = await fetch("/api/v1/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload,
      })
      const json = await res.json()
      setAnswer(json.answer || "No response from AI.")
    } catch (error) {
      console.error("AI request failed:", error)
      setAnswer("❌ Error: Could not connect to AI service.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-4 w-80 border border-gray-300 dark:border-gray-700">
      <h3 className="font-bold mb-2">AI Assistant</h3>
      <Input
        id="ai-question"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAsk()}
      />
      <Button className="mt-2 w-full" onClick={handleAsk} disabled={loading}>
        {loading ? "Thinking..." : "Ask"}
      </Button>

      {answer && (
        <div className="mt-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
          <strong>Answer:</strong>
          <p className="mt-1 whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  )
}
