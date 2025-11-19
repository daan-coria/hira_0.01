import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// =====================================================
// Unified FacilityRow – MUST MATCH CampusSetup.tsx
// =====================================================
export type FacilityRow = {
  id: number;
  costCenterKey: string;
  costCenterName: string;
  campus: string; // pipe-separated when float pool
  functionalArea: string;
  unitGrouping: string;
  capacity: number | "" | "N/A";
  isFloatPool: boolean;
  poolParticipation: string[];
  unitOfService: string;
  sortOrder: number;
};

export type FacilitySetup = FacilityRow[];

// =====================================================
// Other Data Types
// =====================================================

export type ResourceInputRow = {
  id?: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  unit_fte: number;
  weekend_group?: "A" | "B" | "C" | "WC" | "";
  vacancy_status?: string;
};

export type AvailabilityConfigRow = {
  id?: number;
  employee_id?: string;
  staff_name: string;
  type: "PTO" | "LOA" | "Orientation" | "";
  range: { start: string; end: string };
  days: number;
  weekend_group?: string;
};

export type AIMessage = { question: string; answer: string };

export type AIState = {
  isOpen: boolean;
  history: AIMessage[];
};

type DataState = {
  loading: boolean;
  facilitySetup?: FacilitySetup;
  resourceInput?: ResourceInputRow[];
  availabilityConfig?: AvailabilityConfigRow[];
  staffingConfig?: any[];
  shiftConfig?: any[];
  censusOverride?: any[];
  gapSummary?: any[];
  positions?: { id?: number; name: string; category: string }[];
  categories?: string[];
  [key: string]: any;
};

type AppState = {
  facilitySetup?: FacilitySetup | null;
  toolType: "IP" | "ED";
};

export type MasterFilters = {
  facility: string;
  unit: string;
  functionalArea: string;
  startDate: string;
  endDate: string;
  options: {
    facilities: string[];
    units: string[];
    functionalAreas: string[];
  };
};

type AppContextType = {
  state: AppState;
  data: DataState;

  updateData: (key: string, value: any) => void;
  reloadData: () => void;

  // Facility Setup – unified and corrected
  setFacilitySetup: (payload: FacilitySetup) => void;
  updateFacilitySetup: (payload: FacilitySetup) => void;

  setToolType: (type: "IP" | "ED") => void;

  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;

  getFrontendSnapshot: () => Record<string, any>;

  aiState: AIState;
  setAIState: React.Dispatch<React.SetStateAction<AIState>>;

  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;

  master: MasterFilters;
  setMaster: React.Dispatch<React.SetStateAction<MasterFilters>>;
};

// =====================================================
// Context
// =====================================================
const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

// =====================================================
// Provider
// =====================================================
export function AppProvider({ children }: { children: ReactNode }) {
  // -----------------------------
  // Primary State
  // -----------------------------
  const [state, setState] = useState<AppState>({
    facilitySetup: [],
    toolType: "IP",
  });

  // -----------------------------
  // Data State
  // -----------------------------
  const [data, setData] = useState<DataState>({
    loading: true,
    positions: [
      { id: 1, name: "RN", category: "Nursing" },
      { id: 2, name: "LPN", category: "Nursing" },
      { id: 3, name: "CNA", category: "Support" },
      { id: 4, name: "Clerk", category: "Other" },
    ],
    categories: ["Nursing", "Support", "Other"],
  });

  // -----------------------------
  // Step Navigation
  // -----------------------------
  const [currentStep, setCurrentStepState] = useState(() => {
    const saved = localStorage.getItem("hira_current_step");
    return saved ? Number(saved) : 0;
  });

  const setCurrentStep = (value: number | ((prev: number) => number)) => {
    setCurrentStepState((prev) => {
      const v = typeof value === "function" ? value(prev) : value;
      localStorage.setItem("hira_current_step", String(v));
      return v;
    });
  };

  // -----------------------------
  // AI Assistant
  // -----------------------------
  const [aiState, setAIState] = useState<AIState>(() => {
    try {
      const saved = localStorage.getItem("hira_ai_state");
      return saved ? JSON.parse(saved) : { isOpen: false, history: [] };
    } catch {
      return { isOpen: false, history: [] };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("hira_ai_state", JSON.stringify(aiState));
    } catch {}
  }, [aiState]);

  // -----------------------------
  // Global Navigation Menu
  // -----------------------------
  const [menuOpen, setMenuOpen] = useState(false);

  // -----------------------------
  // Master Filters
  // -----------------------------
  const [master, setMaster] = useState<MasterFilters>(() => {
    try {
      const saved = localStorage.getItem("hira_master_filters");
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
              functionalAreas: [],
            },
          };
    } catch {
      return {
        facility: "",
        unit: "",
        functionalArea: "",
        startDate: "",
        endDate: "",
        options: { facilities: [], units: [], functionalAreas: [] },
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("hira_master_filters", JSON.stringify(master));
    } catch {}
  }, [master]);

  // =====================================================
  // DATA UPDATE (resourceInput, etc)
  // =====================================================
  const updateData = (key: string, value: any) => {
    setData((prev) => {
      const updated = { ...prev, [key]: value };

      // Auto-update categories based on positions
      if (key === "positions") {
        const rawCategories = (value as any[])
          .map((v) => v.category)
          .filter(Boolean);

        updated.categories = Array.from(new Set(rawCategories));
      }

      return updated;
    });
  };

  // =====================================================
  // FACILITY SETUP — FULLY FIXED
  // =====================================================
  const setFacilitySetup = (payload: FacilitySetup) => {
    // 1. Save to main state
    setState((prev) => ({ ...prev, facilitySetup: payload }));

    // 2. Mirror into data layer
    setData((prev) => ({ ...prev, facilitySetup: payload }));

    // 3. Save to localStorage
    try {
      localStorage.setItem("hira_facilitySetup", JSON.stringify(payload));
    } catch (err) {
      console.error("Error saving facilitySetup to LS", err);
    }
  };

  const updateFacilitySetup = (payload: FacilitySetup) => {
    setFacilitySetup(payload);
  };

  // =====================================================
  // TOOL TYPE
  // =====================================================
  const setToolType = (type: "IP" | "ED") => {
    setState((prev) => ({ ...prev, toolType: type }));
  };

  // =====================================================
  // MOCK DATA LOADING (unchanged)
  // =====================================================
  const reloadData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }));

      const basePath = `${window.location.origin}/mockdata`;

      const [
        resourceInput,
        availabilityConfig,
        staffingConfig,
        shiftConfig,
        censusOverride,
        gapSummary,
      ] = await Promise.all([
        fetch(`${basePath}/resource-input.json`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`${basePath}/availability-config.json`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`${basePath}/staffing-config.json`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`${basePath}/shift-config.json`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`${basePath}/census-override.json`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`${basePath}/gap-summary.json`).then((r) =>
          r.ok ? r.json() : []
        ),
      ]);

      setData((prev) => ({
        ...prev,
        resourceInput,
        availabilityConfig,
        staffingConfig,
        shiftConfig,
        censusOverride,
        gapSummary,
        loading: false,
      }));
    } catch (err) {
      console.error("❌ mockdata load failed:", err);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // =====================================================
  // AI SNAPSHOT — UPDATED FOR FacilityRow
  // =====================================================
  const getFrontendSnapshot = () => {
    const rows =
      Array.isArray(state.facilitySetup) && state.facilitySetup.length
        ? state.facilitySetup
        : Array.isArray(data.facilitySetup)
        ? data.facilitySetup
        : [];

    return {
      toolType: state.toolType,
      currentStep,

      facilitySummary: {
        totalCostCenters: rows.length,
        floatPools: rows.filter((r) => r.isFloatPool).length,
        uniqueCampuses: Array.from(
          new Set(
            rows.flatMap((r) =>
              r.campus ? r.campus.split("|").filter(Boolean) : []
            )
          )
        ),
        functionalAreas: Array.from(
          new Set(rows.map((r) => r.functionalArea).filter(Boolean))
        ),
      },

      raw: rows,
    };
  };

  // =====================================================
  // CONTEXT VALUE
  // =====================================================
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
    aiState,
    setAIState,

    menuOpen,
    setMenuOpen,

    master,
    setMaster,
  };

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}
