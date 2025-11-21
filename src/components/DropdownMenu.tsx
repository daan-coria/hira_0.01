import { useApp } from "@/store/AppContext"

// Import page components
import ShiftConfigCard from "@/components/ShiftConfigCard"
import PositionStaffingSetupCard from "@/components/PositionStaffingSetupCard"
import ResourceInputCard from "@/components/ResourceInputCard"
import GapSummaryCard from "@/components/GapSummaryCard"
import CensusOverrideCard from "@/components/CensusOverrideCard"
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import CampusSetup from "@/components/CampusSetup"
import HealthSystemSetupPage from "./HealthSystemSetupPage"
import JobConfigurationCard from "./JobConfigurationCard"

export default function DropdownMenu() {
  const {
    currentStep,
    setCurrentStep,
    menuOpen,
    setMenuOpen,
  } = useApp()

  const steps = [
    "Health System Setup",
    "Campus Setup",
    "Weekend Rotation Definition",
    "Job Configuration",
    "Shift Configuration",
    "Staffing Needs",
    "Resource Input",
    "Gap Summary",
    "Staffing Plan",
    "Staffing Grid",
    "Demand",
    "Position Control",
    "----------------- Current pages to be updated -----------------",
    "Resource Availability",
  ]

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <HealthSystemSetupPage />
      case 1: return <CampusSetup />
      case 2: return <div className="p-4">Weekend Rotation Placeholder</div>
      case 3: return <JobConfigurationCard />
      case 4: return <ShiftConfigCard />
      case 5: return <PositionStaffingSetupCard />
      case 6: return <ResourceInputCard />
      case 7: return <GapSummaryCard />
      case 8: return <div className="p-4">Staffing Plan Placeholder</div>
      case 9: return <div className="p-4">Staffing Grid Placeholder</div>
      case 10: return <CensusOverrideCard />
      case 11: return <div className="p-4">Position Control Placeholder</div>
      case 12: return <div className="p-4">Divider (no content)</div>
      case 13: return <AvailabilityConfigCard />
      default: return null
    }
  }

  const handleSelect = (i: number) => {
    if (!steps[i].includes("Current pages")) {
      setCurrentStep(i)
    }
    setMenuOpen(false)
  }

  return (
    <div className="relative w-full">

      {/* POPUP DROPDOWN MENU — Controlled by MenuIcon */}
      {menuOpen && (
        <div className="absolute left-4 top-4 w-64 bg-white shadow-xl border rounded-lg z-50">
          {steps.map((name, i) =>
            name.includes("Current pages") ? (
              <div
                key={i}
                className="px-3 py-2 text-center text-xs text-gray-500 border-y border-dashed"
              >
                {name}
              </div>
            ) : (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                {name}
              </button>
            )
          )}
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className="mt-4 px-6">
        {renderStep()}
      </div>

    </div>
  )
}
