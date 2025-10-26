import { useApp } from "@/store/AppContext"
import { useNavigate } from "react-router-dom"

// Step Components
import FacilityHeader from "@/components/FacilityHeader"
import PositionSetupPage from "@/pages/PositionSetupPage"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import ResourceInputCard from "@/components/ResourceInputCard"
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import PositionStaffingSetupCard from "@/components/PositionStaffingSetupCard"
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

  // Updated total steps and order
  const totalSteps = 8
  const stepNames = [
    "Facility Setup",
    "Position Setup",
    "Shift Configuration",
    "Resource Input",
    "Availability Configuration",
    "Position & Staffing Setup", // merged version
    "Census Override",
    "Gap Summary",
  ]

  // Fractional label support for step 1.5
  const getStepLabel = (index: number): string => {
    if (index === 1) return "1.5" // Position Setup
    if (index > 1) return String(index)
    return "1"
  }

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

  // --- Step Renderer ---
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
              Continue to Position Setup
            </Button>
          </Card>
        )

      case 1:
        return <PositionSetupPage onNext={handleNext} onPrev={handlePrev} />

      case 2:
        return <ShiftConfigCard onNext={handleNext} onPrev={handlePrev} />

      case 3:
        return <ResourceInputCard onNext={handleNext} onPrev={handlePrev} />

      case 4:
        return <AvailabilityConfigCard onNext={handleNext} onPrev={handlePrev} />

      case 5:
        return (
          <PositionStaffingSetupCard onNext={handleNext} onPrev={handlePrev} />
        )

      case 6:
        return <CensusOverrideCard onNext={handleNext} onPrev={handlePrev} />

      case 7:
        return <GapSummaryCard onPrev={handlePrev} onReset={handleReset} />

      default:
        return null
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Always show Facility Header */}
      <FacilityHeader />

      {/* Progress + Step Navigation */}
      <div className="w-full" aria-label="Progress Section">
        <div className="flex flex-wrap justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Step {getStepLabel(currentStep)} of {totalSteps} —{" "}
            {stepNames[currentStep]}
          </h2>
          <span className="text-sm text-gray-600">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Step Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stepNames.map((name, i) => (
            <button
              key={name}
              onClick={() => setCurrentStep(i)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                i === currentStep
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              title={`Go to ${name}`}
            >
              {getStepLabel(i)}. {name}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <progress
          className="w-full h-3 accent-green-600 rounded mt-2"
          value={currentStep + 1}
          max={totalSteps}
          aria-label="Wizard progress"
        />
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
