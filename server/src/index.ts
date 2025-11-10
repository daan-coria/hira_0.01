import express from "express"
import cors from "cors"
import registerRoutes from "./routes/index"

const app = express()

app.use(
  cors({
    origin: [
      "https://hira-0-01.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

app.use(express.json())

registerRoutes(app)

app.get("/", (_, res) => {
  res.send("✅ HIRA API running with CORS enabled")
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
