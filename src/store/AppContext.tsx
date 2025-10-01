import { createContext, useContext, useReducer, ReactNode } from "react"

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

const initialState: AppState = {}

// ---- Reducer ----
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

// ---- Context ----
const AppContext = createContext<{
  state: AppState
  setFacilitySetup: (setup: FacilitySetup) => void
  setToolType: (tool: "IP" | "ED") => void
}>({
  state: initialState,
  setFacilitySetup: () => {},
  setToolType: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

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

// Hook
export const useApp = () => useContext(AppContext)
