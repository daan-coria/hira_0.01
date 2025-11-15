import { useState, useEffect, useMemo, useRef } from "react"
import { useApp } from "@/store/AppContext"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { MessageCircle, X } from "lucide-react"

export default function AIAgent() {
const { getFrontendSnapshot, aiState, setAIState } = useApp()
const [question, setQuestion] = useState("")
const [loading, setLoading] = useState(false)
const [frontendData, setFrontendData] = useState<Record<string, any>>({})
const bottomRef = useRef<HTMLDivElement | null>(null)
  const prevHistoryLenRef = useRef<number>(0)

const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:3001"
    : "https://hira-0-01.onrender.com" // backend URL in production

// Sync snapshot from AppContext
useEffect(() => {
  setFrontendData(getFrontendSnapshot())
}, [getFrontendSnapshot])

  // Auto-scroll to bottom when history grows
  useEffect(() => {
    if (!aiState.isOpen || !bottomRef.current) return

    const prevLen = prevHistoryLenRef.current ?? 0
    const currLen = aiState.history?.length ?? 0

    if (currLen > prevLen) {
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      )
    }

    prevHistoryLenRef.current = currLen
  }, [aiState.history?.length, aiState.isOpen])

// Clear chat history when the page/tab is closed or refreshed
useEffect(() => {
  const handleBeforeUnload = () => {
    setAIState({
      isOpen: false,
      history: [],
    })
  }

  window.addEventListener("beforeunload", handleBeforeUnload)
  return () => {
    // Also clear on component unmount (e.g. route change)
    setAIState({
      isOpen: false,
      history: [],
    })
    window.removeEventListener("beforeunload", handleBeforeUnload)
  }
}, [setAIState])

const jsonPayload = useMemo(
  () => JSON.stringify({ question, frontendData }),
  [question, frontendData]
)

const handleAsk = async () => {
  if (!question.trim()) return
  setLoading(true)

  try {
    const res = await fetch(`${API_BASE}/api/v1/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonPayload,
    })

    if (!res.ok) {
      let errText = `API error ${res.status}`
      try {
        const maybeJson = await res.json()
        errText = maybeJson?.error
          ? `${maybeJson.error}${maybeJson.details ? `: ${maybeJson.details}` : ""}`
          : JSON.stringify(maybeJson)
      } catch {
        errText = await res.text()
      }
      throw new Error(errText || `API error ${res.status}`)
    }

    const json = await res.json()
    const answer = json.answer || "⚠️ No response from AI."

    setAIState((prev) => ({
      ...prev,
      history: [...prev.history, { question, answer }],
    }))
    setQuestion("")
  } catch (error: any) {
    console.error("AI request failed:", error)
    setAIState((prev) => ({
      ...prev,
      history: [
        ...prev.history,
        {
          question,
          answer: `❌ ${error?.message || "Could not connect to AI service."}`,
        },
      ],
    }))
  } finally {
    setLoading(false)
  }
}

return (
  <div className="fixed bottom-4 right-4 z-50">
    {/* Floating chat bubble */}
    {!aiState.isOpen && (
      <button
        onClick={() => setAIState((prev) => ({ ...prev, isOpen: true }))}
        className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-105 focus:outline-none"
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={22} />
      </button>
    )}

    {/* Chat panel */}
    {aiState.isOpen && (
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-4 w-80 border border-gray-300 dark:border-gray-700 animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">
            AI Assistant
          </h3>
          <button
            onClick={() =>
              setAIState((prev) => ({ ...prev, isOpen: false }))
            }
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-2 mb-2 pr-1">
          {aiState.history.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask me anything about your current setup.
            </p>
          )}

          {aiState.history.map((msg, i) => (
            <div key={i} className="mb-3">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                You: {msg.question}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                {msg.answer}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div>
          <Input
            id="ai-question"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <Button
            className="mt-2 w-full"
            onClick={handleAsk}
            disabled={loading}
          >
            {loading ? "Thinking..." : "Ask"}
          </Button>
        </div>
      </div>
    )}
  </div>
)
}
