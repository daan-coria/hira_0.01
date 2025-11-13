import { useApp } from "@/store/AppContext"
import { useNavigate } from "react-router-dom"

// Step Components (kept the same)
import PositionSetupPage from "@/pages/PositionSetupPage"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import ResourceInputCard from "@/components/ResourceInputCard"
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import CensusOverrideCard from "@/components/CensusOverrideCard"
import GapSummaryCard from "@/components/GapSummaryCard"
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

  // Dropdown sections
  const stepNames = [
    "Facility Setup",
    "Position & Staffing Setup",
    "Shift Configuration",
    "Resource Input",
    "Availability Configuration",
    "Demand",
    "Gap Summary",
  ]

  const handleReset = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset everything?"
    )
    if (!confirmReset) return

    setFacilitySetup({} as any)
    setToolType("IP")
    setCurrentStep(0)
    navigate("/setup")
  }

  // STEP CONTENT
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <div className="p-4 text-gray-600">Facility Setup Placeholder</div>

      case 1:
        return <PositionStaffingSetupCard />

      case 2:
        return <ShiftConfigCard />

      case 3:
        return <ResourceInputCard />

      case 4:
        return <AvailabilityConfigCard />

      case 5:
        return <CensusOverrideCard />

      case 6:
        return <GapSummaryCard onReset={handleReset} />

      default:
        return null
    }
  }

  return (
    <div className="w-full">

      {/* MASTER FILTERS BAR — Azure style */}
      <div className="w-full bg-gray-100 border border-gray-200 rounded-t-xl px-4 py-4 mb-6 shadow-sm">

        {/* TOP ROW: DROPDOWN LEFT + Actions right (future) */}
        <div className="flex items-center justify-between mb-4">

          {/* DROPDOWN MENU (top left) */}
          <div className="flex flex-col">
            <label
              htmlFor="sectionSelect"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Navigate
            </label>

            <select
              id="sectionSelect"
              value={currentStep}
              onChange={(e) => setCurrentStep(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800
                         focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all cursor-pointer"
            >
              {stepNames.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* RIGHT SIDE (icons like Azure: Refresh, Reset Filters) */}
          <div className="flex gap-6 text-sm text-blue-600 items-center">
            <button onClick={reloadData} className="hover:underline">
              ↻ Refresh
            </button>
            <button className="hover:underline">
              📤 Export
            </button>
            <button className="hover:underline">
              📊 Insights
            </button>
            <button className="hover:underline">
              📌 Pin filters
            </button>
            <button className="hover:underline">
              🧹 Reset filters
            </button>
          </div>
        </div>

        {/* MASTER FILTERS — always visible */}
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">
            Campus
          </button>
          <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">
            Unit
          </button>
          <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">
            Date Picker: Start - End
          </button>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="px-6">
        {data.loading ? (
          <p className="text-gray-500 text-center mt-10">
            Loading data...
          </p>
        ) : (
          renderStep()
        )}
      </div>
    </div>
  )
}
