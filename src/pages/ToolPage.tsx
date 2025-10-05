import { useApp } from "@/store/AppContext"

// Core Modules
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import StaffingRequirementsCard from "@/components/StaffingRequirementsCard"
import StaffingPlanCard from "@/components/StaffingPlanCard"
import PositionControlCard from "@/components/PositionControlCard"
import GapSummaryCard from "@/components/GapSummaryCard"

// New Modules (Step 5 & 6)
import AvailabilityConfigCard from "@/components/AvailabilityConfigCard"
import CensusOverrideCard from "@/components/CensusOverrideCard"

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

      {/* Step 1 & 2: Resource + Data Context */}
      <section id="resources">
        <ResourceInputCard />
      </section>

      {/* Step 3: Shift Configuration */}
      <section id="shifts">
        <ShiftConfigCard />
      </section>

      {/* Step 4: Staffing Ratios / Config */}
      <section id="staffing-config">
        <StaffingConfigCard />
      </section>

      {/* Steps 5 & 6 (IP Only): Resource Availability + Census Override */}
      {toolType === "IP" && (
        <>
          <section id="availability">
            <AvailabilityConfigCard />
          </section>

          <section id="census-override">
            <CensusOverrideCard />
          </section>
        </>
      )}

      {/* Step 4b (IP only): Staffing Requirements */}
      {toolType === "IP" && (
        <section id="requirements">
          <StaffingRequirementsCard />
        </section>
      )}

      {/* Step 7: Staffing Plan */}
      <section id="plan">
        <StaffingPlanCard />
      </section>

      {/* Position Control */}
      <section id="position">
        <PositionControlCard />
      </section>

      {/* Gap Summary */}
      <section id="gap">
        <GapSummaryCard />
      </section>
    </div>
  )
}
