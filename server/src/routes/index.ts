import { Express } from "express"
import health from "./health"
import test from "./test"
import ai from "./ai"

export default function registerRoutes(app: Express) {
  app.use("/api/v1/health", health)
  app.use("/api/v1/test", test)
  app.use("/api/v1/ai", ai) 
}
