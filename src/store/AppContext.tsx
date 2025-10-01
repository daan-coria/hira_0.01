import React, { createContext, useContext, useReducer, ReactNode } from "react"

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
  | { type: "SET_SETUP"; payload: { setup: FacilitySetup; toolType: "IP" | "ED" } }
  | { type: "RESET" }

const initialState: AppState = {}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SETUP":
      return {
        ...state,
        facilitySetup: action.payload.setup,
        toolType: action.payload.toolType,
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
  dispatch: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
