import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "@/store/AppContext";
import { AuthProvider } from "@/store/AuthContext";
import { TooltipProvider } from "@/store/TooltipContext";

import { MantineProvider } from "@mantine/core";   
import "@mantine/core/styles.css";                 
import "@mantine/dates/styles.css";                

import "./styles/global.pcss";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure <div id='root'></div> exists in index.html");
}

ReactDOM.createRoot(rootElement).render(
  
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <AppProvider>
            
            <MantineProvider>
              <App />
            </MantineProvider>

          </AppProvider>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>

);
