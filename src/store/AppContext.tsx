console.log("💡 Mock mode:", import.meta.env.VITE_USE_MOCK)

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { hiraApi } from "@/services/hiraApi" // ✅ make sure alias is correct for your structure

// ---------------------------------------------
// TYPES
// ---------------------------------------------
export type FacilitySetup = {
  facility: string
  department: string
  costCenter: string
  bedCount: number
  dateRange: { start: string; end: string }
}

export type AppState = {
  facilitySetup: FacilitySetup | null
  toolType: "IP"
}

export type DataState = {
  resourceInput: any[]
  shiftConfig: any[]
  staffingConfig: any[]
  availabilityConfig: any[]
  censusOverride: any[]
  gapSummary: any[]
  loading: boolean
  error?: string
}

// ---------------------------------------------
// INITIAL STATE
// ---------------------------------------------
const initialState: AppState = {
  facilitySetup: null,
  toolType: "IP",
}

const initialData: DataState = {
  resourceInput: [],
  shiftConfig: [],
  staffingConfig: [],
  availabilityConfig: [],
  censusOverride: [],
  gapSummary: [],
  loading: true,
}

// ---------------------------------------------
// REDUCER + ACTIONS
// ---------------------------------------------
type Action =
  | { type: "SET_FACILITY_SETUP"; payload: FacilitySetup | null }
  | { type: "SET_TOOL_TYPE"; payload: "IP" }

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_FACILITY_SETUP":
      return { ...state, facilitySetup: action.payload }
    case "SET_TOOL_TYPE":
      return { ...state, toolType: action.payload }
    default:
      return state
  }
}

// ---------------------------------------------
// CONTEXT
// ---------------------------------------------
type AppContextType = {
  state: AppState
  data: DataState
  setFacilitySetup: (setup: FacilitySetup | null) => void
  setToolType: (type: "IP") => void
  reloadData: () => Promise<void>
  updateData: (key: keyof DataState, value: any[]) => void // ✅ NEW
}

const AppContext = createContext<AppContextType>(null as any)

// ---------------------------------------------
// PROVIDER
// ---------------------------------------------
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [data, setData] = useState<DataState>(initialData)

  const STORAGE_KEY = `hira_ip_state_${import.meta.env.MODE}`

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.facilitySetup) {
          dispatch({ type: "SET_FACILITY_SETUP", payload: parsed.facilitySetup })
        }
      } catch (err) {
        console.error("⚠️ Failed to load saved setup:", err)
      }
    }
  }, [])

  // Save setup to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // ---------------------------------------------
  // Data Loader (Mock or API)
  // ---------------------------------------------
  const reloadData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: undefined }))

      const [
        resourceInput,
        shiftConfig,
        staffingConfig,
        availabilityConfig,
        censusOverride,
        gapSummary,
      ] = await Promise.all([
        hiraApi.getResourceInput(),
        hiraApi.getShiftConfigs(),
        hiraApi.getStaffingConfiguration(),
        hiraApi.getAvailability(),
        hiraApi.getCensusOverride(),
        hiraApi.getGapSummary(),
      ])

      setData({
        resourceInput,
        shiftConfig,
        staffingConfig,
        availabilityConfig,
        censusOverride,
        gapSummary,
        loading: false,
      })
    } catch (err: any) {
      console.error("❌ Data load failed:", err)
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Data load failed",
      }))
    }
  }

  // ✅ Allow any card to update its slice of data
  const updateData = (key: keyof DataState, value: any[]) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Auto-load on mount
  useEffect(() => {
    reloadData()
  }, [])

  const setFacilitySetup = (setup: FacilitySetup | null) =>
    dispatch({ type: "SET_FACILITY_SETUP", payload: setup })

  const setToolType = (type: "IP") =>
    dispatch({ type: "SET_TOOL_TYPE", payload: type })

  return (
    <AppContext.Provider
      value={{
        state,
        data,
        setFacilitySetup,
        setToolType,
        reloadData,
        updateData, // ✅ exposed here
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// ---------------------------------------------
// HOOK
// ---------------------------------------------
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context)
    throw new Error("useApp must be used inside an AppProvider")
  return context
}
