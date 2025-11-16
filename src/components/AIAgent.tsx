import { useState, useEffect, useRef } from "react"
import { useApp } from "@/store/AppContext"
import { useAuth } from "@/store/AuthContext"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { MessageCircle, X } from "lucide-react"

export default function AIAgent() {
  const { isAuthenticated } = useAuth()
  const { getFrontendSnapshot, aiState, setAIState } = useApp()

  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [frontendData, setFrontendData] = useState<Record<string, any>>({})

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const prevHistoryLenRef = useRef<number>(0)

  const API_BASE =
    import.meta.env.MODE === "development"
      ? "http://localhost:3001"
      : "https://hira-0-01.onrender.com"

  // -------------------------------
  // A) Clear chat when user logs out
  // -------------------------------
  useEffect(() => {
    if (!isAuthenticated) {
      setAIState({ isOpen: false, history: [] })
    }
  }, [isAuthenticated, setAIState])

  // -------------------------------
  // B) Hide entire AI Agent if not logged in
  // -------------------------------
  if (!isAuthenticated) return null

  // Sync snapshot
  useEffect(() => {
    setFrontendData(getFrontendSnapshot())
  }, [getFrontendSnapshot])

  // Auto-scroll on new messages
  useEffect(() => {
    if (!aiState.isOpen || !bottomRef.current) return

    const prev = prevHistoryLenRef.current ?? 0
    const curr = aiState.history?.length ?? 0

    if (curr > prev) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    }

    prevHistoryLenRef.current = curr
  }, [aiState.history?.length, aiState.isOpen])

  // Clear chat on page close or unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      setAIState({ isOpen: false, history: [] })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      setAIState({ isOpen: false, history: [] })
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [setAIState])

const handleAsk = async () => {
  if (!question.trim()) return;
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/v1/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        frontendData,   
      }),
    });


      if (!res.ok) {
        let message = `API error ${res.status}`

        try {
          const errJson = await res.clone().json()
          if (errJson?.error) message = errJson.error
        } catch {}

        try {
          const errText = await res.clone().text()
          if (errText) message = errText
        } catch {}

        throw new Error(message)
      }

      const json = await res.json()
      const answer = json.answer || "⚠️ No response from AI."

      setAIState(prev => ({
        ...prev,
        history: [...prev.history, { question, answer }],
      }))
      setQuestion("")
    } catch (error: any) {
      setAIState(prev => ({
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

      {/* Floating bubble */}
      {!aiState.isOpen && (
        <button
          onClick={() =>
            setAIState(prev => ({ ...prev, isOpen: true }))
          }
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-105 focus:outline-none"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Chat panel */}
      {aiState.isOpen && (
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-4 w-80 border border-gray-300 dark:border-gray-700 animate-fade-in flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">AI Assistant</h3>
            <button
              onClick={() =>
                setAIState(prev => ({ ...prev, isOpen: false }))
              }
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>

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
                <p className="text-sm whitespace-pre-wrap">
                  {msg.answer}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div>
            <Input
              id="ai-question"
              placeholder="Ask a question..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAsk()}
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
