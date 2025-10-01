import { Routes, Route, Navigate } from "react-router-dom"
import FacilitySetupCard from "@/components/FacilitySetupCard"
import ToolPage from "@/pages/ToolPage"
import { useApp } from "@/store/AppContext"

export default function App() {
  const { state } = useApp()
  const isSetupComplete = state.facilitySetup && state.toolType

  return (
    <div className="app-shell">
      <header className="app-header p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold">HIRA Staffing Tool</h1>
      </header>

      <main className="p-4">
        <Routes>
          {/* Setup page */}
          <Route path="/setup" element={<FacilitySetupCard />} />

          {/* Tool page */}
          <Route
            path="/tool"
            element={
              isSetupComplete ? (
                <ToolPage />
              ) : (
                <Navigate to="/setup" replace />
              )
            }
          />

          {/* Default route → redirect */}
          <Route
            path="/"
            element={
              isSetupComplete ? (
                <Navigate to="/tool" replace />
              ) : (
                <Navigate to="/setup" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  )
}
