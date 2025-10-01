import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import StaffingPlan from '@/pages/StaffingPlan'
import GapSummary from '@/pages/GapSummary'
import PositionControl from '@/pages/PositionControl'

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold">IP Staffing</h1>
        <nav className="flex gap-3 mt-2">
          <NavLink to="/" className="btn-ghost">Dashboard</NavLink>
          <NavLink to="/plan" className="btn-ghost">Staffing Plan</NavLink>
          <NavLink to="/gap" className="btn-ghost">Gap Summary</NavLink>
          <NavLink to="/position" className="btn-ghost">Position Control</NavLink>
        </nav>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plan" element={<StaffingPlan />} />
          <Route path="/gap" element={<GapSummary />} />
          <Route path="/position" element={<PositionControl />} />
        </Routes>
      </main>
    </div>
  )
}
