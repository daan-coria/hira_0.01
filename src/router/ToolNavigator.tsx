import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/store/AuthContext"
import { LogOut } from "lucide-react" // ✅ lightweight icon

export default function ToolNavigator() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Hide top nav on login page
  if (location.pathname === "/login") return null

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm py-3 px-6 flex justify-between items-center">
      {/* Left side — brand + nav links */}
      <div className="flex items-center space-x-6">
        <h1
          onClick={() => navigate("/")}
          className="text-xl font-bold text-gray-800 cursor-pointer hover:text-green-600 transition"
        >
          HIRA Staffing Tool
        </h1>

        <button
          onClick={() => navigate("/setup")}
          className={`text-sm font-medium transition ${
            location.pathname === "/setup"
              ? "text-green-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Facility Setup
        </button>

        <button
          onClick={() => navigate("/tool")}
          className={`text-sm font-medium transition ${
            location.pathname === "/tool"
              ? "text-green-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Tool
        </button>
      </div>

      {/* Right side — Logout button */}
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-1.5 px-4 rounded-full transition-all shadow-sm"
      >
        <LogOut size={16} className="opacity-80" />
        <span>Logout</span>
      </button>
    </nav>
  )
}
