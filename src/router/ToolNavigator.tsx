import { NavLink } from "react-router-dom"
import { useApp } from "@/store/AppContext"

export default function ToolNavigator() {
  const { state } = useApp()
  const { toolType } = state

  return (
    <nav className="flex gap-3 border-b border-gray-200 bg-white px-4 py-2 sticky top-0 z-10">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `px-3 py-1 rounded-lg ${
            isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
          }`
        }
      >
        Dashboard
      </NavLink>

      <NavLink
        to="/plan"
        className={({ isActive }) =>
          `px-3 py-1 rounded-lg ${
            isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
          }`
        }
      >
        Staffing Plan
      </NavLink>

      <NavLink
        to="/position"
        className={({ isActive }) =>
          `px-3 py-1 rounded-lg ${
            isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
          }`
        }
      >
        Position Control
      </NavLink>

      <NavLink
        to="/gap"
        className={({ isActive }) =>
          `px-3 py-1 rounded-lg ${
            isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
          }`
        }
      >
        Gap Summary
      </NavLink>

      {/* Conditional: Only show if IP tool */}
      {toolType === "IP" && (
        <NavLink
          to="/requirements"
          className={({ isActive }) =>
            `px-3 py-1 rounded-lg ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          Staffing Requirements
        </NavLink>
      )}
    </nav>
  )
}
