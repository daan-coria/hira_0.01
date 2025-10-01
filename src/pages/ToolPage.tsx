import { useApp } from "@/store/AppContext"

// Components (flow order)
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import StaffingRequirementsCard from "@/components/StaffingRequirementsCard"
import StaffingPlanCard from "@/components/StaffingPlanCard"
import PositionControlCard from "@/components/PositionControlCard"
import GapSummaryCard from "@/components/GapSummaryCard"

export default function ToolPage() {
  const { state } = useApp()
  const { facilitySetup, toolType } = state

  if (!facilitySetup || !toolType) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Setup Required</h2>
        <p>Please complete Facility Setup in the header above before using the tool.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">
        {toolType === "IP" ? "Inpatient (IP) Staffing Tool" : "Emergency Department (ED) Staffing Tool"}
      </h2>

      {/* Flow order */}
      <ResourceInputCard />
      <ShiftConfigCard />
      <StaffingConfigCard />
      {toolType === "IP" && <StaffingRequirementsCard />}
      <StaffingPlanCard />
      <PositionControlCard />
      <GapSummaryCard />
    </div>
  )
}
