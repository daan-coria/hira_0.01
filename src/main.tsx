import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { AppProvider } from "@/store/AppContext"
import "./styles/global.pcss"

// Ensure root element exists before rendering
const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Root element not found. Make sure <div id='root'></div> exists in index.html")
}

// Standard React 18 rendering structure
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
)
