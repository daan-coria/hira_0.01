import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars for the current mode (dev, prod, etc.)
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    },
    define: {
      // Make env vars accessible in your app
      __APP_ENV__: JSON.stringify(env.APP_ENV || mode),
    },
  }
})
