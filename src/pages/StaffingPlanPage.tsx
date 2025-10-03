import StaffingPlanCard from "@/components/StaffingPlanCard"
import ResourceInputCard from "@/components/ResourceInputCard"
import ShiftConfigCard from "@/components/ShiftConfigCard"
import StaffingConfigCard from "@/components/StaffingConfigCard"
import StaffingRequirementsCard from "@/components/StaffingRequirementsCard"

export default function StaffingPlanPage() {
  return (
    <div className="space-y-6">
      <ResourceInputCard />
      <ShiftConfigCard />
      <StaffingConfigCard />
      <StaffingRequirementsCard /> {/* Only shows for IP */}
      <StaffingPlanCard />
    </div>
  )
}
