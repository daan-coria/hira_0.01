import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { TooltipProvider } from "@/store/TooltipContext"

// Context
import { AuthProvider, useAuth } from "@/store/AuthContext"

// Components
import ToolNavigator from "@/router/ToolNavigator"
import AIAgent from "@/components/AIAgent"
import MasterFilters from "@/components/MasterFilters"

// Pages
import DashboardPage from "@/pages/DashboardPage"
import LoginPage from "@/pages/LoginPage"
import DropdownMenu from "./components/DropdownMenu"

// Protected Route wrapper
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col relative">
          
          {/* Top Nav */}
          <ToolNavigator />

          {/* Master Filters visible only when logged in AND not on login page */}
          {isAuthenticated && location.pathname !== "/login" && (
            <div className="max-w-7xl mx-auto w-full px-6">
              <MasterFilters />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto px-6 py-6 space-y-8 w-full">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tool"
                element={
                  <ProtectedRoute>
                    <DropdownMenu />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t bg-white text-center py-3 text-sm text-gray-500">
            © {new Date().getFullYear()} HIRA Staffing Tool. All rights reserved.
          </footer>

          {/* AI Assistant */}
          <AIAgent />
        </div>
      </TooltipProvider>
    </AuthProvider>
  )
}
