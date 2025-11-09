import express, { Request, Response } from "express"
import cors from "cors"
import registerRoutes from "./routes/index"

const app = express()

// ✅ Middleware
app.use(express.json())
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      "https://hira.vercel.app", // your deployed frontend
    ],
    methods: ["GET", "POST"],
    credentials: false,
  })
)

// Register routes
registerRoutes(app)

// Root health check
app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "HIRA backend running 🚀" })
})

// Start server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})
