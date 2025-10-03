import GapSummaryCard from "@/components/GapSummaryCard"

export default function GapSummaryPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Gap Summary</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Compare available vs. required FTEs to identify staffing gaps.
        </p>
      </header>

      {/* Gap Summary Module */}
      <section id="gap-summary">
        <GapSummaryCard />
      </section>
    </div>
  )
}
