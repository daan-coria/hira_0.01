import React, { createContext, useContext, useReducer, ReactNode } from "react"

/** Keep this type local so other files don't need to import it */
type FacilitySetup = {
  facility: string
  department: string
  costCenter: string
  bedCount: number
  dateRange: { start: string; end: string }
}

type RefreshStatus = "idle" | "loading" | "success" | "error"

type AppState = {
  facilitySetup?: FacilitySetup
  toolType?: "IP" | "ED"
  refreshStatus: RefreshStatus
  lastRefreshData?: any
}

type Action =
  | { type: "SET_SETUP"; payload: { setup: FacilitySetup; toolType: "IP" | "ED" } }
  | { type: "SET_REFRESH"; payload: { status: RefreshStatus; data?: any } }
  | { type: "RESET" }

const initialState: AppState = {
  refreshStatus: "idle",
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SETUP":
      return {
        ...state,
        facilitySetup: action.payload.setup,
        toolType: action.payload.toolType,
      }
    case "SET_REFRESH":
      return {
        ...state,
        refreshStatus: action.payload.status,
        lastRefreshData: action.payload.data ?? state.lastRefreshData,
      }
    case "RESET":
      return initialState
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
}>({
  state: initialState,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispatch: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
