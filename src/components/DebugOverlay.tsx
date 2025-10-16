import { useApp } from "@/store/AppContext"

export default function DebugOverlay() {
  const { state, currentStep } = useApp()

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "rgba(0,0,0,0.8)",
        color: "lime",
        padding: "10px 14px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 9999,
      }}
    >
      <div>🔎 <b>Debug Overlay</b></div>
      <div>Step: {currentStep}</div>
      <div>Tool: {state.toolType}</div>
      <div>Facility: {state.facilitySetup?.facility || "(none)"}</div>
    </div>
  )
}
