import { useApp } from "@/store/AppContext"
import { useNavigate } from "react-router-dom"

// Components
import ShiftConfigCard from "@/components/ShiftConfigCard"
import PositionStaffingSetupCard from "@/components/PositionStaffingSetupCard"
import ResourceInputCard from "@/components/ResourceInputCard"
import GapSummaryCard from "@/components/GapSummaryCard"
import CensusOverrideCard from "@/components/CensusOverrideCard"
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import FacilityHeader from "@/components/FacilityHeader"

export default function ToolPage() {
  const navigate = useNavigate()
  const { data, currentStep, setCurrentStep, setToolType, setFacilitySetup, reloadData } = useApp()

  // ---------------------------------------
  // DROPDOWN STEPS — IN NEW REQUIRED ORDER
  // ---------------------------------------
  const stepNames = [
    "Health System Setup",                  // 1 (Placeholder)
    "Facility Setup",                       // 2 (FacilityHeader)
    "Weekend Rotation Definition",          // 3 (Placeholder)
    "Job Configuration",                    // 4 (Placeholder)
    "Shift Configuration",                  // 5 (ShiftConfigCard)
    "Staffing Needs",                       // 6 (PositionStaffingSetupCard)
    "Resource Input",                       // 7 (ResourceInputCard)
    "Gap Summary",                          // 8 (GapSummaryCard)
    "Staffing Plan",                        // 9 (Placeholder)
    "Staffing Grid",                        // 10 (Placeholder)
    "Demand",                               // 11 (CensusOverrideCard)
    "Position Control",                     // 12 (Placeholder)
    "----------------- Current pages to be updated -----------------", // Divider
    "Resource Availability",                // 13 (AvailabilityConfigCard)
  ]

  // Reset
  const handleReset = () => {
    if (!window.confirm("Reset all data?")) return
    setFacilitySetup({} as any)
    setToolType("IP")
    setCurrentStep(0)
    navigate("/tool")
  }

  // ---------------------------------------
  // RENDER PAGE CONTENT
  // ---------------------------------------
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <div className="p-4 text-gray-600">Health System Setup Placeholder</div>

      case 1:
        return <FacilityHeader />

      case 2:
        return <div className="p-4 text-gray-600">Weekend Rotation Placeholder</div>

      case 3:
        return <div className="p-4 text-gray-600">Job Configuration Placeholder</div>

      case 4:
        return <ShiftConfigCard />

      case 5:
        return <PositionStaffingSetupCard />

      case 6:
        return <ResourceInputCard />

      case 7:
        return <GapSummaryCard onReset={handleReset} />

      case 8:
        return <div className="p-4 text-gray-600">Staffing Plan Placeholder</div>

      case 9:
        return <div className="p-4 text-gray-600">Staffing Grid Placeholder</div>

      case 10:
        return <CensusOverrideCard />

      case 11:
        return <div className="p-4 text-gray-600">Position Control Placeholder</div>

      // Divider (do not render UI)
      case 12:
        return (
          <div className="p-4 text-gray-500 italic text-center">
            Select an actual page (divider)
          </div>
        )

      case 13:
        return <AvailabilityConfigCard />

      default:
        return null
    }
  }

  return (
    <div className="w-full">

      {/* MASTER FILTERS BAR */}
      <div className="w-full bg-gray-100 border border-gray-200 rounded-t-xl px-4 py-4 mb-6 shadow-sm">

        {/* TOP: DROPDOWN + RIGHT ACTIONS */}
        <div className="flex items-center justify-between mb-4">

          {/* DROPDOWN MENU */}
          <div className="flex flex-col">
            <label
              htmlFor="navigateSelect"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Navigate
            </label>

            <select
              id="navigateSelect"
              value={currentStep}
              onChange={(e) => setCurrentStep(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800
                        focus:ring-2 focus:ring-green-600 focus:border-green-600 cursor-pointer"
            >
              {stepNames.map((name, i) => (
                <option
                  key={i}
                  value={i}
                  disabled={name.includes("Current pages to be updated")}
                >
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* RIGHT SIDE ACTION BUTTONS */}
          <div className="flex gap-6 text-sm text-blue-600 items-center">
            <button onClick={reloadData} className="hover:underline">↻ Refresh</button>
            <button className="hover:underline">📤 Export</button>
            <button className="hover:underline">🧹 Reset Filters</button>
          </div>
        </div>

        {/* MASTER FILTERS */}
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">Campus</button>
          <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">Unit</button>
          <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">Date Picker: Start – End</button>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="px-6">
        {data.loading ? (
          <p className="text-gray-500 text-center mt-10">Loading data...</p>
        ) : (
          renderStep()
        )}
      </div>
    </div>
  )
}
