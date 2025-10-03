import { useApp } from "@/store/AppContext"
import { useNavigate } from "react-router-dom"
import Button from "@/components/ui/Button"

export default function DashboardPage() {
  const { state } = useApp()
  const { facilitySetup } = state
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Welcome to HIRA Staffing Tool
      </h2>
      <p className="text-gray-600">
        Configure your facility and access staffing analytics for{" "}
        Inpatient (IP) and Emergency Department (ED) units.
      </p>

      <div className="mt-6">
        {!facilitySetup ? (
          <Button onClick={() => navigate("/setup")} variant="primary">
            Start Facility Setup
          </Button>
        ) : (
          <Button onClick={() => navigate("/tool")} variant="primary">
            Go to Tool
          </Button>
        )}
      </div>
    </div>
  )
}
