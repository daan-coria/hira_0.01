import FacilityHeader from "@/components/FacilityHeader"

export default function FacilitySetupPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Facility Setup</h2>
        <p className="text-gray-600 mt-1 text-sm">
          Select a facility, department, cost center, bed count, and date range
          to begin using the staffing tool.
        </p>
      </header>

      {/* Facility Setup Form */}
      <section id="facility-setup">
        <FacilityHeader />
      </section>
    </div>
  )
}
