import { Navigate } from "react-router-dom"
import { useApp } from "@/store/AppContext"

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { state } = useApp()
  const { facilitySetup } = state

  if (!facilitySetup) {
    // Redirect to setup if not configured
    return <Navigate to="/setup" replace />
  }

  return children
}
