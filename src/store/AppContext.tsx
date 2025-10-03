import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react"

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

type Action =
  | { type: "SET_FACILITY_SETUP"; payload: FacilitySetup }
  | { type: "SET_TOOL_TYPE"; payload: "IP" | "ED" }
  | { type: "LOAD_STATE"; payload: AppState }

const initialState: AppState = {}

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
  setFacilitySetup: (setup: FacilitySetup) => void
  setToolType: (tool: "IP" | "ED") => void
}>(null as any)

// ---- Provider ----
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

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

  const setFacilitySetup = (setup: FacilitySetup) =>
    dispatch({ type: "SET_FACILITY_SETUP", payload: setup })

  const setToolType = (tool: "IP" | "ED") =>
    dispatch({ type: "SET_TOOL_TYPE", payload: tool })

  return (
    <AppContext.Provider value={{ state, setFacilitySetup, setToolType }}>
      {children}
    </AppContext.Provider>
  )
}

// ---- Hook ----
export const useApp = () => useContext(AppContext)
