import express from "express"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 5173

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")))

app.listen(PORT, () => {
  console.log(`✅ Mock server running: http://localhost:${PORT}/mockdata/facility.json`)
})
