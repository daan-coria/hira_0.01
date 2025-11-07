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
  functionalArea?: string
  department?: string
  costCenter?: string
  bedCount?: number
  categories?: string[]
  source?: string
}

// Resource Input row (Step 4)
export type ResourceInputRow = {
  id?: number
  employee_id: string
  first_name: string
  last_name: string
  position: string
  unit_fte: number
  availability?: string
  weekend_group?: "A" | "B" | "C" | "WC" | ""
  vacancy_status?: string
}

// Availability Configuration row (Step 5)
export type AvailabilityConfigRow = {
  id?: number
  employee_id?: string
  staff_name: string
  type: "PTO" | "LOA" | "Orientation" | ""
  range: { start: string; end: string }
  days: number
  weekend_group?: string
}

type AppState = {
  facilitySetup?: FacilitySetup | null
  toolType: "IP" | "ED"
}

type DataState = {
  loading: boolean
  resourceInput?: ResourceInputRow[]
  availabilityConfig?: AvailabilityConfigRow[]
  staffingConfig?: any[]
  shiftConfig?: any[]
  censusOverride?: any[]
  gapSummary?: any[]
  positions?: { id?: number; name: string; category: string }[]
  categories?: string[]
  [key: string]: any
}

type AppContextType = {
  state: AppState
  data: DataState
  updateData: (key: string, value: any) => void
  reloadData: () => void
  setFacilitySetup: (payload: FacilitySetup) => void
  updateFacilitySetup: (payload: FacilitySetup) => void
  setToolType: (type: "IP" | "ED") => void
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
    facilitySetup: {
      categories: ["Nursing", "Support", "Other"],
    },
    toolType: "IP",
  })

  // Shared Data (from multiple mock files)
  const [data, setData] = useState<DataState>({
    loading: true,
    positions: [
      { id: 1, name: "RN", category: "Nursing" },
      { id: 2, name: "LPN", category: "Nursing" },
      { id: 3, name: "CNA", category: "Support" },
      { id: 4, name: "Clerk", category: "Other" },
    ],
    categories: ["Nursing", "Support", "Other"],
  })

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
    setData((prev) => {
      const updated = { ...prev, [key]: value }

      if (key === "positions") {
        const rawCategories = (value as { category?: string }[])
          .map((v) => v.category)
          .filter((c): c is string => Boolean(c && c.trim()))

        const uniqueCats: string[] = Array.from(new Set(rawCategories))

        // Sync categories in both state and data
        setState((prevState) => ({
          ...prevState,
          facilitySetup: {
            ...(prevState.facilitySetup || {}),
            categories:
              uniqueCats.length > 0
                ? uniqueCats
                : prevState.facilitySetup?.categories || [
                    "Nursing",
                    "Support",
                    "Other",
                  ],
          },
        }))

        updated.categories =
          uniqueCats.length > 0
            ? uniqueCats
            : prev.categories || ["Nursing", "Support", "Other"]
      }

      return updated
    })
  }

  // -----------------------
  // Reload Data from /mockdata
  // -----------------------
  const reloadData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }))
      const basePath = `${window.location.origin}/mockdata`

      const [
        resourceInput,
        availabilityConfig,
        staffingConfig,
        shiftConfig,
        censusOverride,
        gapSummary,
      ] = await Promise.all([
        fetch(`${basePath}/resource-input.json`)
          .then((r) =>
            r.ok ? r.json() : Promise.reject("resource-input.json not found")
          )
          .catch((err) => {
            console.warn("⚠️ Missing resource-input.json:", err)
            return []
          }),
        fetch(`${basePath}/availability-config.json`)
          .then((r) =>
            r.ok
              ? r.json()
              : Promise.reject("availability-config.json not found")
          )
          .catch((err) => {
            console.warn("⚠️ Missing availability-config.json:", err)
            return []
          }),
        fetch(`${basePath}/staffing-config.json`)
          .then((r) =>
            r.ok ? r.json() : Promise.reject("staffing-config.json not found")
          )
          .catch((err) => {
            console.warn("⚠️ Missing staffing-config.json:", err)
            return []
          }),
        fetch(`${basePath}/shift-config.json`)
          .then((r) =>
            r.ok ? r.json() : Promise.reject("shift-config.json not found")
          )
          .catch((err) => {
            console.warn("⚠️ Missing shift-config.json:", err)
            return []
          }),
        fetch(`${basePath}/census-override.json`)
          .then((r) =>
            r.ok ? r.json() : Promise.reject("census-override.json not found")
          )
          .catch((err) => {
            console.warn("⚠️ Missing census-override.json:", err)
            return []
          }),
        fetch(`${basePath}/gap-summary.json`)
          .then((r) =>
            r.ok ? r.json() : Promise.reject("gap-summary.json not found")
          )
          .catch((err) => {
            console.warn("⚠️ Missing gap-summary.json:", err)
            return []
          }),
      ])

      const merged: DataState = {
        resourceInput,
        availabilityConfig,
        staffingConfig,
        shiftConfig,
        censusOverride,
        gapSummary,
        loading: false,
        positions: data.positions,
        categories: data.categories,
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
