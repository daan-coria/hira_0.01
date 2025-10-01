import { useApp } from "@/store/AppContext"

// Components
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import StaffingRequirementsCard from "@/components/StaffingRequirementsCard"
import PositionControlCard from "@/components/PositionControlCard"
import GapSummaryCard from "@/components/GapSummaryCard"

export default function ToolPage() {
  const { state } = useApp()
  const { toolType, facilitySetup } = state

  if (!toolType || !facilitySetup) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Setup Required</h2>
        <p>Please complete Facility Setup before continuing.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold mb-4">
        {toolType === "IP" ? "Inpatient Tool" : "Emergency Department Tool"}
      </h2>

      {/* Common steps for both tools */}
      <ResourceInputCard />
      <ShiftConfigCard />
      <StaffingConfigCard />

      {/* IP-only step */}
      {toolType === "IP" && <StaffingRequirementsCard />}

      {/* Final steps */}
      <PositionControlCard />
      <GapSummaryCard />
    </div>
  )
}
