import ResourceSummaryCard from '@/components/ResourceSummaryCard'
import ResourceInputCard from '@/components/ResourceInputCard'
import CensusChart from '@/components/CensusChart'
import StaffingConfigCard from '@/components/StaffingConfigCard'
import StaffingPlanCard from '@/components/StaffingPlanCard'
import GapSummaryCard from '@/components/GapSummaryCard'
import PositionControlCard from '@/components/PositionControlCard'


export default function Dashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <ResourceSummaryCard />
      <ResourceInputCard />
      <CensusChart />
      <StaffingConfigCard />
      <StaffingPlanCard />
      <GapSummaryCard />
      <PositionControlCard />
    </div>
  )
}
