import { useState } from "react"
import { Menu } from "lucide-react"
import { useApp } from "@/store/AppContext"

// Import your page components
import ShiftConfigCard from "@/components/ShiftConfigCard"
import PositionStaffingSetupCard from "@/components/PositionStaffingSetupCard"
import ResourceInputCard from "@/components/ResourceInputCard"
import GapSummaryCard from "@/components/GapSummaryCard"
import CensusOverrideCard from "@/components/CensusOverrideCard"
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import FacilityHeader from "@/components/FacilityHeader"

export default function DropdownMenu() {
  const { currentStep, setCurrentStep } = useApp()
  const [open, setOpen] = useState(false)

  const steps = [
    "Health System Setup",
    "Facility Setup",
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

  // Render the content based on selected step
  const renderStep = () => {
    switch (currentStep) {
      case 0: return <div className="p-4">Health System Setup Placeholder</div>
      case 1: return <FacilityHeader />
      case 2: return <div className="p-4">Weekend Rotation Placeholder</div>
      case 3: return <div className="p-4">Job Configuration Placeholder</div>
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
    setOpen(false)
  }

  return (
    <div className="relative w-full">
      {/* Hamburger Icon */}
      <div className="absolute left-4 top-4 z-50">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle Menu"
          title="Toggle Menu"
          className="p-2 rounded-md hover:bg-gray-200"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Popover Menu */}
      {open && (
        <div className="absolute left-4 top-14 w-64 bg-white shadow-xl border rounded-lg z-50">
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
      <div className="mt-16 px-6">
        {renderStep()}
      </div>
    </div>
  )
}
