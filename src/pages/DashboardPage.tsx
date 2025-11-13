import { useApp } from "@/store/AppContext"
import { useNavigate } from "react-router-dom"
import Button from "@/components/ui/Button"

export default function DashboardPage() {
  const { state } = useApp()
  const { facilitySetup } = state
  const navigate = useNavigate()

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome to HIRA Staffing Tool
        </h2>
        <p className="text-gray-600 mt-1 text-sm">
          Configure your facility and access staffing analytics for{" "}
          Inpatient (IP) and Emergency Department (ED) units.
        </p>
      </header>

      {/* Actions */}
          <Button onClick={() => navigate("/tool")} variant="primary">
            Go to Staffing Tool
          </Button>

    </div>
  )
}
