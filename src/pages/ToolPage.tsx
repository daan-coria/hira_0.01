import { useApp } from "@/store/AppContext"
import { useNavigate } from "react-router-dom"

// Step Components
import FacilityHeader from "@/components/FacilityHeader"
import PositionSetupPage from "@/pages/PositionSetupPage" // ✅ New Step 1.5
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import CensusOverrideCard from "@/components/CensusOverrideCard"
import GapSummaryCard from "@/components/GapSummaryCard"

// UI Components
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

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

  // ✅ Updated total step count
  const totalSteps = 8
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1)
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  const handleReset = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset the wizard and start over? All progress will be lost."
    )
    if (!confirmReset) return

    setFacilitySetup({} as any)
    setToolType("IP")
    setCurrentStep(0)
    navigate("/setup")
  }

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
              Continue to Step 1.5
            </Button>
          </Card>
        )

      case 1:
        return <PositionSetupPage onNext={handleNext} onPrev={handlePrev} />

      case 2:
        return <ResourceInputCard onNext={handleNext} onPrev={handlePrev} />

      case 3:
        return <ShiftConfigCard onNext={handleNext} onPrev={handlePrev} />

      case 4:
        return <StaffingConfigCard onNext={handleNext} onPrev={handlePrev} />

      case 5:
        return <AvailabilityConfigCard onNext={handleNext} onPrev={handlePrev} />

      case 6:
        return <CensusOverrideCard onNext={handleNext} onPrev={handlePrev} />

      case 7:
        return <GapSummaryCard onPrev={handlePrev} onReset={handleReset} />

      default:
        return null
    }
  }

  const stepNames = [
    "Facility Setup",
    "Position Setup",
    "Resource Input",
    "Shift Configuration",
    "Staffing Configuration",
    "Availability Configuration",
    "Census Override",
    "Gap Summary",
  ]

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Always show Facility Header at top */}
      <FacilityHeader />

      {/* Progress Section */}
      <div className="w-full" aria-label="Progress Section">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-semibold text-gray-800">
            Step {currentStep + 1} of {totalSteps} — {stepNames[currentStep]}
          </h2>
          <span className="text-sm text-gray-600">
            {Math.round(progressPercent)}%
          </span>
        </div>

        <progress
          className="w-full h-3 accent-green-500 rounded"
          value={currentStep + 1}
          max={totalSteps}
          aria-label="Wizard progress"
        />
      </div>

      {/* Render Step Content */}
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
