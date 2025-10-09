import { useNavigate } from "react-router-dom"
import FacilityHeader from "@/components/FacilityHeader"
import { useApp } from "@/store/AppContext"
import { useEffect } from "react"

export default function FacilitySetupPage() {
  const navigate = useNavigate()
  const { state } = useApp()

  // ✅ Auto-redirect if facility already set up
  useEffect(() => {
    if (state.facilitySetup && state.toolType) {
      navigate("/tool")
    }
  }, [state, navigate])

  const handleSetupComplete = () => {
    // ✅ Redirect to main tool page
    navigate("/tool")
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Facility Setup</h2>
        <p className="text-gray-600 mt-1 text-sm">
          Select a facility, department, cost center, bed count, and date range
          to begin using the staffing tool.
        </p>
      </header>

      {/* Facility Setup Form */}
      <section id="facility-setup">
        <FacilityHeader onSetupComplete={handleSetupComplete} />
      </section>
    </div>
  )
}
