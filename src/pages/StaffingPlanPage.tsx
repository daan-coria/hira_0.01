import { useApp } from "@/store/AppContext"

// Components
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import GapSummaryCard from "@/components/GapSummaryCard"

export default function StaffingPlanPage() {
  const { state } = useApp()
  const { toolType } = state

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Staffing Plan</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Define staffing resources, shifts, and ratios. The system will
          generate a staffing plan and gap summary based on your configuration.
        </p>
      </header>

      {/* Step 1: Resources */}
      <section id="resources">
        <ResourceInputCard />
      </section>

      {/* Step 2: Shifts */}
      <section id="shifts">
        <ShiftConfigCard />
      </section>

      {/* Step 3: Staffing Configuration */}
      <section id="staffing-config">
        <StaffingConfigCard />
      </section>

      {/* Step 4: Gap Summary / Output */}
      <section id="gap-summary">
        <GapSummaryCard />
      </section>
    </div>
  )
}
