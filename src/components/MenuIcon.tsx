import { Menu } from "lucide-react"
import { useApp } from "@/store/AppContext"
import { useEffect } from "react"

export default function MenuIcon() {
  const { menuOpen, setMenuOpen } = useApp()

  // Close menu when pressing ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [setMenuOpen])

  return (
    <button
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      title={menuOpen ? "Close menu" : "Open menu"}
      onClick={() => setMenuOpen(!menuOpen)}
      className={`p-2 rounded-md transition 
        ${menuOpen ? "bg-gray-300" : "hover:bg-gray-200"}`}
    >
      <Menu 
        size={20} 
        className={`transition-transform ${menuOpen ? "rotate-90" : "rotate-0"}`} 
      />
    </button>
  )
}
