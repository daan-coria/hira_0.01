import { useApp } from "@/store/AppContext"

// Modules
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import StaffingPlanCard from "@/components/StaffingPlanCard"
import PositionControlCard from "@/components/PositionControlCard"
import GapSummaryCard from "@/components/GapSummaryCard"
import StaffingRequirementsCard from "@/components/StaffingRequirementsCard"

export default function ToolPage() {
  const { state } = useApp()
  const { facilitySetup, toolType } = state

  if (!facilitySetup) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please complete Facility Setup first.
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold text-gray-800">
        {toolType === "IP"
          ? "Inpatient Staffing Tool"
          : "Emergency Department Staffing Tool"}
      </h2>

      <section id="resources">
        <ResourceInputCard />
      </section>

      <section id="shifts">
        <ShiftConfigCard />
      </section>

      <section id="staffing-config">
        <StaffingConfigCard />
      </section>

      {toolType === "IP" && (
        <section id="requirements">
          <StaffingRequirementsCard />
        </section>
      )}

      <section id="plan">
        <StaffingPlanCard />
      </section>

      <section id="position">
        <PositionControlCard />
      </section>

      <section id="gap">
        <GapSummaryCard />
      </section>
    </div>
  )
}
