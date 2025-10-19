import { Routes, Route, Navigate } from "react-router-dom"
import { TooltipProvider } from "@/store/TooltipContext"

// Context
import { AuthProvider, useAuth } from "@/store/AuthContext"

// Components
import ToolNavigator from "@/router/ToolNavigator"

// Pages
import FacilitySetupPage from "@/pages/FacilitySetupPage"
import ToolPage from "@/pages/ToolPage"
import DashboardPage from "@/pages/DashboardPage"
import LoginPage from "@/pages/LoginPage"

// 🔐 Protected Route wrapper
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
          {/* Top Nav (only shows inside tool) */}
          <ToolNavigator />

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto px-6 py-6 space-y-8 w-full">
            <Routes>
              {/* Login Page */}
              <Route path="/login" element={<LoginPage />} />

              {/* Landing Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Facility Setup */}
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <FacilitySetupPage />
                  </ProtectedRoute>
                }
              />

              {/* Tool Page */}
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
      </TooltipProvider>
    </AuthProvider>
  )
}
