import ai from "./ai"

export default (app: any) => {
  app.use("/api/v1/health", health)
  app.use("/api/v1/test", test)
  app.use("/api/v1/ai", ai) //New AI route
}
