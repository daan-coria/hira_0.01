import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/store/AuthContext"

import ToolNavigator from "@/router/ToolNavigator"
import AIAgent from "@/components/AIAgent"
import MasterFilters from "@/components/MasterFilters"

import DashboardPage from "@/pages/DashboardPage"
import LoginPage from "@/pages/LoginPage"
import DropdownMenu from "@/components/DropdownMenu"

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function AppShell() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col relative">
      <ToolNavigator />

      {/* Show only after login */}
      {isAuthenticated && location.pathname === "/tool" && (
        <div className="max-w-7xl mx-auto w-full px-6">
          <MasterFilters />
        </div>
      )}

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

      <footer className="border-t bg-white text-center py-3 text-sm text-gray-500">
        © {new Date().getFullYear()} HIRA Staffing Tool. All rights reserved.
      </footer>

      <AIAgent />
    </div>
  )
}
