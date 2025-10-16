import { useApp } from "@/store/AppContext"
import styles from "./DebugOverlay.module.css"

export default function DebugOverlay() {
  const { state, currentStep } = useApp()

  return (
    <div className={styles.container}>
      <div>🔎 <b>Debug Overlay</b></div>
      <div>Step: {currentStep}</div>
      <div>Tool: {state.toolType}</div>
      <div>Facility: {state.facilitySetup?.facility || "(none)"}</div>
    </div>
  )
}
