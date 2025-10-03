import { useApp } from "@/store/AppContext"

export default function ToolNavigator() {
  const { state } = useApp()
  const { toolType } = state

  const linkClasses =
    "px-3 py-1 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"

  return (
    <nav className="flex gap-3 border-b border-gray-200 bg-white px-4 py-2 sticky top-0 z-10">
      <a href="#resources" className={linkClasses}>
        Resources
      </a>
      <a href="#shifts" className={linkClasses}>
        Shifts
      </a>
      <a href="#staffing-config" className={linkClasses}>
        Staffing Config
      </a>
      {toolType === "IP" && (
        <a href="#requirements" className={linkClasses}>
          Staffing Requirements
        </a>
      )}
      <a href="#plan" className={linkClasses}>
        Staffing Plan
      </a>
      <a href="#position" className={linkClasses}>
        Position Control
      </a>
      <a href="#gap" className={linkClasses}>
        Gap Summary
      </a>
    </nav>
  )
}
