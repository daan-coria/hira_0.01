import { useApp } from "@/store/AppContext"

// Components
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import StaffingRequirementsCard from "@/components/StaffingRequirementsCard"
import StaffingPlanCard from "@/components/StaffingPlanCard"

export default function StaffingPlanPage() {
  const { state } = useApp()
  const { toolType } = state

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Staffing Plan</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Define staffing resources, shifts, and ratios. The system will generate a staffing plan based on your configuration.
        </p>
      </header>

      {/* Inputs */}
      <section id="resources">
        <ResourceInputCard />
      </section>

      <section id="shifts">
        <ShiftConfigCard />
      </section>

      <section id="staffing-config">
        <StaffingConfigCard />
      </section>

      {/* IP-only module */}
      {toolType === "IP" && (
        <section id="requirements">
          <StaffingRequirementsCard />
        </section>
      )}

      {/* Output */}
      <section id="plan">
        <StaffingPlanCard />
      </section>
    </div>
  )
}
