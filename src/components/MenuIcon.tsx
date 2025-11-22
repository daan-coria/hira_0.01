import { Menu } from "lucide-react"
import { useApp } from "@/store/AppContext"
import { useNavigate, useLocation } from "react-router-dom"

export default function MenuIcon() {
  const { menuOpen, setMenuOpen } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    // If we're NOT on the tool page → go to /tool first
    if (location.pathname !== "/tool") {
      navigate("/tool")
      setTimeout(() => setMenuOpen(true), 50)  
    } else {
      setMenuOpen(!menuOpen)
    }
  }

  return (
    <button
      aria-label="Toggle menu"
      title="Toggle menu"
      onClick={handleClick}
      className={`p-2 rounded-md hover:bg-gray-200 transition`}
    >
      <Menu size={20} className="text-gray-800" />
    </button>
  )
}
