import FacilityHeader from "@/components/FacilityHeader"

export default function FacilitySetupPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">
        Facility Setup
      </h2>
      <p className="text-gray-600">
        Select a facility, department, cost center, and date range to begin using the staffing tool.
      </p>
      <FacilityHeader />
    </div>
  )
}
