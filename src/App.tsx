import { Routes, Route, Navigate } from "react-router-dom"
import FacilityHeader from "@/components/FacilityHeader"
import ToolPage from "@/pages/ToolPage"
import { useApp } from "@/store/AppContext"

export default function App() {
  const { state } = useApp()
  const isSetupComplete = Boolean(state.facilitySetup && state.toolType)

  return (
    <div className="app-shell">
      <header className="app-header border-b border-gray-200">
        <h1 className="p-4 text-lg font-semibold">HIRA Staffing Tool</h1>
        <FacilityHeader />
      </header>

      <main className="p-4">
        <Routes>
          <Route
            path="/tool"
            element={isSetupComplete ? <ToolPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/"
            element={
              isSetupComplete ? (
                <Navigate to="/tool" replace />
              ) : (
                <p className="text-gray-500 mt-4">Please complete setup above.</p>
              )
            }
          />
        </Routes>
      </main>
    </div>
  )
}
