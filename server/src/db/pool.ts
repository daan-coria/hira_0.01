import mysql from "mysql2/promise"

let pool: mysql.Pool | null = null

if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASS) {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 10,
  })
  console.log("✅ Database pool initialized")
} else {
  console.warn("⚠️ Database credentials not set — skipping DB connection.")
}

export default pool

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error("Database pool not initialized.")
  }
  return pool
}
