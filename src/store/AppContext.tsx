import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"

// Define your types
type FacilitySetup = {
  facility?: string
  department?: string
  costCenter?: string
  bedCount?: number
  dateRange?: {
    start?: string
    end?: string
  }
}

type AppState = {
  facilitySetup?: FacilitySetup | null
  toolType: "IP" | "ED"
}

type DataState = {
  loading: boolean
  [key: string]: any
}

// Context shape
type AppContextType = {
  state: AppState
  data: DataState
  updateData: (key: string, value: any) => void
  reloadData: () => void
  setFacilitySetup: (payload: FacilitySetup) => void
  setToolType: (type: "IP" | "ED") => void
  updateFacilitySetup: (payload: FacilitySetup) => void
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within an AppProvider")
  return context
}

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  // -----------------------
  // Core app state
  // -----------------------
  const [state, setState] = useState<AppState>({
    facilitySetup: null,
    toolType: "IP",
  })

  // -----------------------
  // Shared data
  // -----------------------
  const [data, setData] = useState<DataState>({ loading: true })

  // -----------------------
  // Global step control (persistent)
  // -----------------------
  const [currentStep, setCurrentStepState] = useState(() => {
    // Try loading the last saved step from localStorage
    const saved = localStorage.getItem("hira_current_step")
    return saved ? Number(saved) : 0
  })

  // Wrapped setter that saves to localStorage too
  const setCurrentStep = (value: number | ((prev: number) => number)) => {
    setCurrentStepState((prev) => {
      const newStep = typeof value === "function" ? value(prev) : value
      localStorage.setItem("hira_current_step", String(newStep))
      return newStep
    })
  }

  // -----------------------
  // Data management
  // -----------------------
  const updateData = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const reloadData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }))
      // Load mock JSON or future API data
      const response = await fetch("/mockdata/data.json")
      const result = await response.json()
      setData({ ...result, loading: false })
    } catch (err) {
      console.error("Error reloading data:", err)
      setData((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    reloadData()
  }, [])

  // -----------------------
  // Facility + tool management
  // -----------------------
  const setFacilitySetup = (payload: FacilitySetup) => {
    setState((prev) => ({ ...prev, facilitySetup: payload }))
  }

  const updateFacilitySetup = (payload: FacilitySetup) => {
    setState((prev) => ({
      ...prev,
      facilitySetup: { ...prev.facilitySetup, ...payload },
    }))
  }

  const setToolType = (type: "IP" | "ED") => {
    setState((prev) => ({ ...prev, toolType: type }))
  }

  // -----------------------
  // Provider value
  // -----------------------
  const value: AppContextType = {
    state,
    data,
    updateData,
    reloadData,
    setFacilitySetup,
    updateFacilitySetup,
    setToolType,
    currentStep,
    setCurrentStep,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
