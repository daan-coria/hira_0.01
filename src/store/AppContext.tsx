console.log("💡 Mock mode:", import.meta.env.VITE_USE_MOCK)


import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from "react"
import { hiraApi } from "@/services/hiraApi"

// ---- Types ----
type FacilitySetup = {
  facility: string
  department: string
  costCenter: string
  bedCount: number
  dateRange: { start: string; end: string }
}

type AppState = {
  facilitySetup?: FacilitySetup
  toolType?: "IP" | "ED"
}

// ---- Extra state for data loading ----
type DataState = {
  facility: any[]
  resourceInput: any[]
  staffingConfig: any[]
  shiftConfig: any[]
  availabilityConfig: any[]
  census: any[]
  staffingRequirements: any[]
  staffingPlan: any[]
  gapSummary: any[]
  positionControl: any[]
  loading: boolean
  error?: string
}

// ---- Actions ----
type Action =
  | { type: "SET_FACILITY_SETUP"; payload: FacilitySetup }
  | { type: "SET_TOOL_TYPE"; payload: "IP" | "ED" }
  | { type: "LOAD_STATE"; payload: AppState }

const initialState: AppState = {}
const initialData: DataState = {
  facility: [],
  resourceInput: [],
  staffingConfig: [],
  shiftConfig: [],
  availabilityConfig: [],
  census: [],
  staffingRequirements: [],
  staffingPlan: [],
  gapSummary: [],
  positionControl: [],
  loading: true,
}

// ---- Namespaced key based on environment ----
const STORAGE_KEY = `hira_app_state_${import.meta.env.MODE || "dev"}`

// ---- Reducer ----
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_FACILITY_SETUP":
      return { ...state, facilitySetup: action.payload }
    case "SET_TOOL_TYPE":
      return { ...state, toolType: action.payload }
    case "LOAD_STATE":
      return { ...state, ...action.payload }
    default:
      return state
  }
}

// ---- Context ----
const AppContext = createContext<{
  state: AppState
  data: DataState
  setFacilitySetup: (setup: FacilitySetup) => void
  setToolType: (tool: "IP" | "ED") => void
  reloadData: () => Promise<void>
}>(null as any)

// ---- Provider ----
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [data, setData] = useState<DataState>(initialData)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        dispatch({ type: "LOAD_STATE", payload: JSON.parse(stored) })
      } catch (err) {
        console.error("Failed to parse saved state", err)
      }
    }
  }, [])

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const reloadData = async () => {
    try {
      setData((d) => ({ ...d, loading: true }))
      const [
        facility,
        resourceInput,
        staffingConfig,
        shiftConfigs,
        availability,
        census,
        staffingRequirements,
        staffingPlan,
        gapSummary,
        positionControl,
      ] = await Promise.all([
        hiraApi.getFacility(),
        hiraApi.getResourceInput(),
        hiraApi.getStaffingConfiguration(),
        hiraApi.getShiftConfigs(),
        hiraApi.getAvailability(),
        hiraApi.getCensus(),
        hiraApi.getStaffingRequirements(),
        hiraApi.getStaffingPlan(),
        hiraApi.getGapSummary(),
        hiraApi.getPositionControl(),
      ])
      setData({
        facility,
        resourceInput,
        staffingConfig,
        shiftConfig: shiftConfigs,
        availabilityConfig: availability,
        census,
        staffingRequirements,
        staffingPlan,
        gapSummary,
        positionControl,
        loading: false,
      })
    } catch (err: any) {
      console.error("Data load failed:", err)
      setData((d) => ({
        ...d,
        loading: false,
        error: err.message || "Load failed",
      }))
    }
  }


  useEffect(() => {
    reloadData()
  }, [])

  const setFacilitySetup = (setup: FacilitySetup) =>
    dispatch({ type: "SET_FACILITY_SETUP", payload: setup })

  const setToolType = (tool: "IP" | "ED") =>
    dispatch({ type: "SET_TOOL_TYPE", payload: tool })

  return (
    <AppContext.Provider
      value={{ state, data, setFacilitySetup, setToolType, reloadData }}
    >
      {children}
    </AppContext.Provider>
  )
}

// ---- Hook ----
export const useApp = () => useContext(AppContext)
