import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "@/store/TooltipContext"
import { AuthProvider } from "@/store/AuthContext"
import { AppProvider } from "@/store/AppContext"
import AppShell from "./AppShell"

export default function App() {
  return (
    <BrowserRouter>
        <TooltipProvider>
          <AppProvider>
            <AppShell />
          </AppProvider>
        </TooltipProvider>
    </BrowserRouter>
  )
}
