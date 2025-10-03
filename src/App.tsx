import { Routes, Route } from "react-router-dom"

// Components
import ToolNavigator from "@/router/ToolNavigator"
import ProtectedRoute from "@/router/ProtectedRoute"

// Pages
import FacilitySetupPage from "@/pages/FacilitySetupPage"
import ToolPage from "@/pages/ToolPage"
import DashboardPage from "@/pages/DashboardPage"

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Top Nav (only shows inside tool) */}
      <ToolNavigator />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-6 space-y-8 w-full">
        <Routes>
          {/* Landing dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Facility setup */}
          <Route path="/setup" element={<FacilitySetupPage />} />

          {/* Protected Tool */}
          <Route
            path="/tool"
            element={
              <ProtectedRoute>
                <ToolPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white text-center py-3 text-sm text-gray-500">
        © {new Date().getFullYear()} HIRA Staffing Tool. All rights reserved.
      </footer>
    </div>
  )
}
