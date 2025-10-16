import { useApp } from "@/store/AppContext"

export default function ToolNavigator() {
  const { state, currentStep, setCurrentStep } = useApp()
  const { toolType } = state

  const links = [
    { label: "Facility Setup", step: 0 },
    { label: "Resources", step: 1 },
    { label: "Shifts", step: 2 },
    { label: "Staffing Config", step: 3 },
  ]

  if (toolType === "IP") {
    links.push({ label: "Availability Config", step: 4 })
    links.push({ label: "Census Override", step: 5 })
  }

  links.push({ label: "Gap Summary", step: 6 })

  const linkClasses = (isActive: boolean) =>
    `px-3 py-1 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer transition ${
      isActive ? "bg-green-100 text-green-700 font-semibold" : ""
    }`

  return (
    <nav className="flex gap-3 border-b border-gray-200 bg-white px-4 py-2 sticky top-0 z-10">
      {links.map((link) => (
        <button
          key={link.label}
          onClick={() => setCurrentStep(link.step)}
          className={linkClasses(currentStep === link.step)}
        >
          {link.label}
        </button>
      ))}
    </nav>
  )
}
