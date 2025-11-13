import { useApp } from "@/store/AppContext"
import { useNavigate } from "react-router-dom"

// Step Components (still rendered for now)
import FacilityHeader from "@/components/FacilityHeader"
import PositionSetupPage from "@/pages/PositionSetupPage"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import ResourceInputCard from "@/components/ResourceInputCard"
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import CensusOverrideCard from "@/components/CensusOverrideCard"
import GapSummaryCard from "@/components/GapSummaryCard"

// UI Components
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import PositionStaffingSetupCard from "@/components/PositionStaffingSetupCard"

export default function ToolPage() {
  const navigate = useNavigate()
  const {
    state,
    setFacilitySetup,
    setToolType,
    reloadData,
    data,
    currentStep,
    setCurrentStep,
  } = useApp()

  // All section names (now without numbers)
  const stepNames = [
    "Facility Setup",
    "Position & Staffing Setup",
    "Shift Configuration",
    "Resource Input",
    "Availability Configuration",
    "Demand",
    "Gap Summary",
  ]

  const handleNext = () => {
    if (currentStep < stepNames.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleReset = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset? All progress will be lost."
    )
    if (!confirmReset) return

    setFacilitySetup({} as any)
    setToolType("IP")
    setCurrentStep(0)
    navigate("/setup")
  }

  // --- Step Renderer (kept as-is for now) ---
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="p-4">
            <p className="text-gray-700 mb-3">
              Complete facility setup to begin using the HIRA IP Tool.
            </p>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!state.facilitySetup}
            >
              Continue to Position & Staffing Setup
            </Button>
          </Card>
        )

      case 1:
        return <PositionStaffingSetupCard onNext={handleNext} onPrev={handlePrev} />

      case 2:
        return <ShiftConfigCard onNext={handleNext} onPrev={handlePrev} />

      case 3:
        return <ResourceInputCard onNext={handleNext} onPrev={handlePrev} />

      case 4:
        return <AvailabilityConfigCard onNext={handleNext} onPrev={handlePrev} />

      case 5:
        return <CensusOverrideCard onNext={handleNext} onPrev={handlePrev} />

      case 6:
        return <GapSummaryCard onPrev={handlePrev} onReset={handleReset} />

      default:
        return null
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">

      {/* Always show Facility Header */}
      <FacilityHeader />

      {/* NEW NAVIGATION AREA — Dropdown Only */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <label
            htmlFor="sectionSelect"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Navigate to section
          </label>

          <select
            id="sectionSelect"
            value={currentStep}
            onChange={(e) => setCurrentStep(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800
                       focus:ring-2 focus:ring-green-600 focus:border-green-600 cursor-pointer transition-all"
          >
            {stepNames.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step Content */}
      {data.loading ? (
        <p className="text-gray-500 text-center mt-10">
          Loading data, please wait...
        </p>
      ) : (
        <div>{renderStep()}</div>
      )}

      {/* Reload Button */}
      <div className="text-center">
        <Button variant="ghost" onClick={reloadData}>
          🔁 Reload Mock Data
        </Button>
      </div>
    </div>
  )
}
