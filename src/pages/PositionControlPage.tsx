import PositionControlCard from "@/components/PositionControlCard"

export default function PositionControlPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Position Control</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Track budgeted vs filled positions and manage open FTEs for each role.
        </p>
      </header>

      {/* Position Control Module */}
      <section id="position-control">
        <PositionControlCard />
      </section>
    </div>
  )
}
