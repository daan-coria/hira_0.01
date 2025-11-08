import { useState } from "react"
import { useAuth } from "@/store/AuthContext"
import { useNavigate } from "react-router-dom"

export default function LoginPage() {
  const { login } = useAuth()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!login(password)) {
      setError("Invalid password")
    } else {
      navigate("/") // Use React Router navigation instead of window.location
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1e293b] p-8 rounded-2xl shadow-xl w-80 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center mb-4">HIRA Access</h1>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-slate-100 text-gray-900 focus:outline-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold transition"
        >
          Enter
        </button>
      </form>
    </div>
  )
}
