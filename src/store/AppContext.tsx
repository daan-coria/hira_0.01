import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"

// -----------------------
// Type Definitions
// -----------------------
type FacilitySetup = {
  facility?: string
  department?: string
  costCenter?: string
  bedCount?: number
  dateRange?: {
    start?: string
    end?: string
  }
  categories?: string[]
}

type AppState = {
  facilitySetup?: FacilitySetup | null
  toolType: "IP" | "ED"
}

type DataState = {
  loading: boolean
  resourceInput?: any[]
  availabilityConfig?: any[]
  staffingConfig?: any[]
  shiftConfig?: any[]
  censusOverride?: any[]
  gapSummary?: any[]
  [key: string]: any
}

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

// -----------------------
// Context Setup
// -----------------------
const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within an AppProvider")
  return context
}

// -----------------------
// Provider
// -----------------------
export function AppProvider({ children }: { children: ReactNode }) {
  // Core App State
  const [state, setState] = useState<AppState>({
    facilitySetup: null,
    toolType: "IP",
  })

  // Shared Data (will be filled by multiple mock files)
  const [data, setData] = useState<DataState>({ loading: true })

  // Step control with localStorage persistence
  const [currentStep, setCurrentStepState] = useState(() => {
    const saved = localStorage.getItem("hira_current_step")
    return saved ? Number(saved) : 0
  })

  const setCurrentStep = (value: number | ((prev: number) => number)) => {
    setCurrentStepState((prev) => {
      const newStep = typeof value === "function" ? value(prev) : value
      localStorage.setItem("hira_current_step", String(newStep))
      return newStep
    })
  }

  // -----------------------
  // Data Management
  // -----------------------
  const updateData = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const reloadData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }))

      // ✅ Load all mock files in parallel
      const [
        resourceInput,
        availabilityConfig,
        staffingConfig,
        shiftConfig,
        censusOverride,
        gapSummary,
      ] = await Promise.all([
        fetch("/mockdata/resource-input.json").then((r) => r.json()),
        fetch("/mockdata/availability-config.json").then((r) => r.json()),
        fetch("/mockdata/staffing-config.json").then((r) => r.json()),
        fetch("/mockdata/shift-config.json").then((r) => r.json()),
        fetch("/mockdata/census-override.json").then((r) => r.json()),
        fetch("/mockdata/gap-summary.json").then((r) => r.json()),
      ])

      const merged = {
        resourceInput,
        availabilityConfig,
        staffingConfig,
        shiftConfig,
        censusOverride,
        gapSummary,
        loading: false,
      }

      setData(merged)
      console.log("✅ Loaded all mockdata:", merged)
    } catch (err) {
      console.error("❌ Error loading mockdata:", err)
      setData((prev) => ({ ...prev, loading: false }))
    }
  }

  // Load mock data on mount
  useEffect(() => {
    reloadData()
  }, [])

  // -----------------------
  // Facility + Tool Management
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
  // Context Value
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
