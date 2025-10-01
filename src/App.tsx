import { Routes, Route } from "react-router-dom"

// Components
import FacilityHeader from "@/components/FacilityHeader"
import ToolNavigator from "@/router/ToolNavigator"

// Pages
import ToolPage from "@/pages/ToolPage"
import StaffingPlan from "@/pages/StaffingPlanPage"
import PositionControl from "@/pages/PositionControlPage"
import GapSummary from "@/pages/GapSummaryPage"
import Dashboard from "@/pages/DashboardPage" 

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <FacilityHeader />
        </div>
      </header>

      {/* Navigation */}
      <ToolNavigator />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-6 space-y-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tool" element={<ToolPage />} />
          <Route path="/plan" element={<StaffingPlan />} />
          <Route path="/position" element={<PositionControl />} />
          <Route path="/gap" element={<GapSummary />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white text-center py-3 text-sm text-gray-500">
        © {new Date().getFullYear()} HIRA Staffing Tool. All rights reserved.
      </footer>
    </div>
  )
}
