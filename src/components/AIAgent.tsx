import { useState, useEffect, useRef } from "react"
import { useApp } from "@/store/AppContext"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { MessageCircle, X } from "lucide-react"

export default function AIAgent() {
  const { aiState, setAIState, getFrontendSnapshot } = useApp()
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const prevHistoryLenRef = useRef<number>(0)

  const API_BASE =
    import.meta.env.MODE === "development"
      ? "http://localhost:3001"
      : "https://hira-0-01.onrender.com"

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

  // Clear on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      setAIState({
        isOpen: false,
        history: [],
      })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      setAIState({
        isOpen: false,
        history: [],
      })
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [setAIState])

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)

    // Lightweight snapshot at question time
    const snapshot = getFrontendSnapshot()

    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          snapshot,       
          frontendData: snapshot, 
        }),
      })

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
        <div
          className="
            bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-300 
            dark:border-gray-700 flex flex-col 
            w-[90vw] max-w-[380px] 
            max-h-[80vh] md:max-h-[70vh]
            overflow-hidden animate-fade-in
          "
        >
          {/* HEADER */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-gray-200">
              AI Assistant
            </h3>

            <button
              onClick={() => setAIState(prev => ({ ...prev, isOpen: false }))}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>


          {/* MESSAGES (SCROLLABLE) */}
          <div
            className="
              flex-1 overflow-y-auto px-4 py-3 
              space-y-4 text-sm
            "
          >
            {aiState.history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                Ask me anything about your facility setup, shifts or health system.
              </p>
            ) : (
              aiState.history.map((msg, i) => (
                <div key={i} className="space-y-1">
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    You: {msg.question}
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {msg.answer}
                  </p>
                </div>
              ))
            )}
            
            <div ref={bottomRef} />
          </div>

          {/* INPUT BAR */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
            <Input
              placeholder="Ask a question..."
              id=""
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAsk()}
              className="flex-1"
            />
            <Button onClick={handleAsk} disabled={loading}>
              {loading ? "…" : "Ask"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}