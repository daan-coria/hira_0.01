import { createContext, useContext, useState, ReactNode, useEffect } from "react"

type TooltipContextType = {
  activeId: string | null
  setActiveId: (id: string | null) => void
}

const TooltipContext = createContext<TooltipContextType | null>(null)

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // 🧠 Auto-close when tapping/clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = () => setActiveId(null)
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  return (
    <TooltipContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </TooltipContext.Provider>
  )
}

export function useTooltip() {
  const ctx = useContext(TooltipContext)
  if (!ctx) throw new Error("useTooltip must be used within a TooltipProvider")
  return ctx
}
