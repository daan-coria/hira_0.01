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
// Facility Setup now stores the FULL GRID:
export type CostCenterRow = {
  id: string
  facility: string
  campus: string
  functionalArea: string
  unit: string
  costCenter: string
  capacity: number | "N/A"
  costCenterName: string
  unitGrouping: string[]
  floatPool: boolean
  poolParticipation: string[]
  unitOfService: string
  sortOrder: number
}

// FacilitySetup = full array of rows
type FacilitySetup = CostCenterRow[]


type MasterFilters = {
  facility: string
  unit: string
  functionalArea: string
  startDate: string
  endDate: string
  options: {
    facilities: string[]
    units: string[]
    functionalAreas: string[]
  }
}

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

export type AvailabilityConfigRow = {
  id?: number
  employee_id?: string
  staff_name: string
  type: "PTO" | "LOA" | "Orientation" | ""
  range: { start: string; end: string }
  days: number
  weekend_group?: string
}

// -----------------------
// AI Agent State
// -----------------------
export type AIMessage = { question: string; answer: string }

export type AIState = {
  isOpen: boolean
  history: AIMessage[]
}

// -----------------------
// Main App State
// -----------------------
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
  getFrontendSnapshot: () => Record<string, any>

  // AI Assistant
  aiState: AIState
  setAIState: React.Dispatch<React.SetStateAction<AIState>>

  // GLOBAL MENU STATE
  menuOpen: boolean
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>

  // Master Filters
  master: MasterFilters
  setMaster: React.Dispatch<React.SetStateAction<MasterFilters>>
}

// -----------------------
// Context
// -----------------------
const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used inside AppProvider")
  return ctx
}

// -----------------------
// Provider
// -----------------------
export function AppProvider({ children }: { children: ReactNode }) {
  // Core App State
  const [state, setState] = useState<AppState>({
    facilitySetup: [],
    toolType: "IP",
  })

  // Data
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

  // Step persistence
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
  // AI Assistant State
  // -----------------------
  const [aiState, setAIState] = useState<AIState>(() => {
    const saved = localStorage.getItem("hira_ai_state")
    return saved ? JSON.parse(saved) : { isOpen: false, history: [] }
  })

  useEffect(() => {
    localStorage.setItem("hira_ai_state", JSON.stringify(aiState))
  }, [aiState])

  // -----------------------
  //  GLOBAL CONTEXT STATE
  // -----------------------
  const [menuOpen, setMenuOpen] = useState(false)
  const [master, setMaster] = useState<MasterFilters>(() => {
    const saved = localStorage.getItem("hira_master_filters")
    return saved
      ? JSON.parse(saved)
      : {
          facility: "",
          unit: "",
          functionalArea: "",
          startDate: "",
          endDate: "",
          options: {
            facilities: [],
            units: [],
            functionalAreas: []
          }
        }
  })

  useEffect(() => {
    localStorage.setItem("hira_master_filters", JSON.stringify(master))
  }, [master])

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

        updated.categories =
          uniqueCats.length > 0 ? uniqueCats : prev.categories || ["Nursing", "Support", "Other"]
      }

      return updated
    })
  }
  // -----------------------
  // Reload Data
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
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(`${basePath}/availability-config.json`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(`${basePath}/staffing-config.json`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(`${basePath}/shift-config.json`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(`${basePath}/census-override.json`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(`${basePath}/gap-summary.json`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ])

      setData({
        resourceInput,
        availabilityConfig,
        staffingConfig,
        shiftConfig,
        censusOverride,
        gapSummary,
        loading: false,
        positions: data.positions,
        categories: data.categories,
      })
    } catch (err) {
      console.error("❌ mockdata load failed:", err)
      setData((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    reloadData()
  }, [])

  // -----------------------
  // Facility Setup
  // -----------------------
  const setFacilitySetup = (payload: FacilitySetup) => {
    setState((prev) => ({ ...prev, facilitySetup: payload }))
  }

  // For arrays, updateFacilitySetup should REPLACE — not merge — the array
  const updateFacilitySetup = (payload: FacilitySetup) => {
    setState((prev) => ({ ...prev, facilitySetup: payload }))
  }

  const setToolType = (type: "IP" | "ED") => {
    setState((prev) => ({ ...prev, toolType: type }))
  }

  // -----------------------
  // AI Snapshot
  // -----------------------
  const getFrontendSnapshot = () => {
  // 1) Health System Setup from localStorage
  let campusesFromLS: any[] = [];
  let regionsFromLS: string[] = [];
  let campusSortMode: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const campusesRaw = window.localStorage.getItem("hira_campuses");
      if (campusesRaw) campusesFromLS = JSON.parse(campusesRaw);
    } catch {}

    try {
      const regionsRaw = window.localStorage.getItem("hira_regions");
      if (regionsRaw) regionsFromLS = JSON.parse(regionsRaw);
    } catch {}

    try {
      const sortRaw = window.localStorage.getItem("hira_campuses_sortMode");
      if (sortRaw) campusSortMode = sortRaw;
    } catch {}
  }

  const healthSystem = {
    campuses: campusesFromLS,
    regions: regionsFromLS,
    campusSortMode,
  };

  // 2) Facility Summary
  const rows: CostCenterRow[] = Array.isArray(state.facilitySetup)
    ? (state.facilitySetup as CostCenterRow[])
    : [];

  const facilitySet = new Set<string>();
  const campusSet = new Set<string>();
  const unitSet = new Set<string>();
  const functionalAreaSet = new Set<string>();
  const bedCounts: Record<string, number> = {};
  const facilityFunctionalAreaCounts: Record<string, Record<string, number>> = {};

  for (const r of rows) {
    if (r.facility) facilitySet.add(r.facility);
    if (r.campus) campusSet.add(r.campus);

    if (Array.isArray(r.unitGrouping)) {
      r.unitGrouping.forEach((u) => u && unitSet.add(u));
    }

    if (r.functionalArea) functionalAreaSet.add(r.functionalArea);

    if (r.facility && typeof r.capacity === "number") {
      bedCounts[r.facility] = (bedCounts[r.facility] || 0) + r.capacity;
    }

    if (r.facility && r.functionalArea) {
      if (!facilityFunctionalAreaCounts[r.facility]) {
        facilityFunctionalAreaCounts[r.facility] = {};
      }
      const faMap = facilityFunctionalAreaCounts[r.facility];
      faMap[r.functionalArea] = (faMap[r.functionalArea] || 0) + 1;
    }
  }

  const facilitySummary = {
    rowCount: rows.length,
    facilityCount: facilitySet.size,
    campusCount: campusSet.size,
    unitCount: unitSet.size,
    functionalAreaCount: functionalAreaSet.size,
    facilities: Array.from(facilitySet),
    campuses: Array.from(campusSet),
    units: Array.from(unitSet),
    functionalAreas: Array.from(functionalAreaSet),
    bedCounts,
    facilityFunctionalAreaCounts,
  };

  // 3) Shift Configuration (trimmed)
  const rawShifts: any[] = Array.isArray(data.shiftConfig)
    ? data.shiftConfig
    : [];

  const shifts = rawShifts.map((s, idx) => ({
    index: idx,
    shift_group: s.shift_group ?? "",
    shift_name: s.shift_name ?? s.shift_label ?? "",
    start_time: s.start_time ?? "",
    end_time: s.end_time ?? "",
    break_minutes: typeof s.break_minutes === "number" ? s.break_minutes : null,
    total_hours: typeof s.total_hours === "number" ? s.total_hours : null,
    shift_type: s.shift_type ?? "",
    days: Array.isArray(s.days) ? s.days : [],
    campuses: Array.isArray(s.campuses) ? s.campuses : [],
    roles: Array.isArray(s.roles) ? s.roles : [],
  }));

  // 4) Resource Input (NEW!)
  const resourceInput = Array.isArray(data.resourceInput)
    ? data.resourceInput.map((r) => ({
        employee_id: r.employee_id ?? "",
        first_name: r.first_name ?? "",
        last_name: r.last_name ?? "",
        position: r.position ?? "",
        unit_fte: r.unit_fte ?? 0,
        weekend_group: r.weekend_group ?? "",
        vacancy_status: r.vacancy_status ?? "",
      }))
    : [];

  return {
    toolType: state.toolType,      // <-- FIXED
    currentStep,
    healthSystem,
    facilitySummary,
    shifts,
    resourceInput, 
    }
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
    getFrontendSnapshot,

    // AI Agent
    aiState,
    setAIState,

    // Global menu
    menuOpen,
    setMenuOpen,

    // GLOBAL MASTER FILTERS 
    master,
    setMaster,
}


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
