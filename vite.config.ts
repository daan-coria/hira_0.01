import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
    publicDir: "public",

    server: {
      port: 5173,
      strictPort: true,
      fs: {
        allow: [path.resolve(__dirname)],
      },
      // 👌 No proxy — clean setup for frontend-only dev
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // Enables "@/..." imports everywhere
      },
    },

    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV || mode), // Useful for environment-based config
    },
  }
})
