import { useApp } from "@/store/AppContext"
import FacilitySetupCard from "@/components/FacilityHeader"
import ToolPage from "@/pages/ToolPage"

export default function ToolNavigator() {
  const { state } = useApp()

  if (!state.facilitySetup || !state.toolType) {
    // User has not yet completed setup
    return (
      <div className="p-6">
        <FacilitySetupCard />
      </div>
    )
  }

  // User completed setup → load the right tool flow
  return (
    <div className="p-6">
      <ToolPage />
    </div>
  )
}
