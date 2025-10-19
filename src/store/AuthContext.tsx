import { createContext, useContext, useState, ReactNode, useEffect } from "react"

type AuthContextType = {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("auth")
    if (saved === "true") setIsAuthenticated(true)
  }, [])

  const login = (password: string) => {
    if (password === import.meta.env.VITE_APP_LOGIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("auth", "true")
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("auth")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
