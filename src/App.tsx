import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "@/store/TooltipContext"
import { AuthProvider } from "@/store/AuthContext"
import AppShell from "./AppShell"

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  )
}
