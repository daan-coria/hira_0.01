import { useState } from "react"
import { useApp } from "@/store/AppContext"

type FacilitySetup = {
  facility: string
  department: string
  costCenter: string
  bedCount: number
  dateRange: { start: string; end: string }
}

export default function FacilityHeader() {
  const { dispatch } = useApp()

  const [facility, setFacility] = useState("")
  const [department, setDepartment] = useState("")
  const [costCenter, setCostCenter] = useState("")
  const [bedCount, setBedCount] = useState<number>(0)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = async () => {
    if (!facility || !department || !costCenter || !dateRange.start || !dateRange.end) {
      alert("Please complete all fields")
      return
    }

    const toolType: "IP" | "ED" =
      department.toLowerCase().includes("ed") ? "ED" : "IP"

    const setup: FacilitySetup = {
      facility,
      department,
      costCenter,
      bedCount,
      dateRange,
    }

    try {
      setLoading(true)
      setError(null)
      // Let the app know we’re loading
      dispatch({ type: "SET_REFRESH", payload: { status: "loading" } })

      // Call backend to refresh (roster, open reqs, ADT, etc.)
      const res = await fetch("/api/refresh-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setup),
      })
      if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${res.statusText}`)
      const result = await res.json()

      // Save setup + tool selection
      dispatch({ type: "SET_SETUP", payload: { setup, toolType } })
      // Save refresh result
      dispatch({ type: "SET_REFRESH", payload: { status: "success", data: result } })

      setLastRefreshed(new Date().toLocaleString())
    } catch (err: any) {
      const msg = err?.message ?? "Failed to refresh data"
      setError(msg)
      dispatch({ type: "SET_REFRESH", payload: { status: "error" } })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs font-medium">Facility</label>
        <input className="input w-40" value={facility} onChange={e => setFacility(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium">Department</label>
        <select className="input w-48" value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">-- Select Department --</option>
          <option value="IP - Inpatient">Inpatient (IP)</option>
          <option value="ED - Emergency">Emergency (ED)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium">Cost Center</label>
        <input className="input w-32" value={costCenter} onChange={e => setCostCenter(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium">Bed Count</label>
        <input type="number" className="input w-24" value={bedCount} onChange={e => setBedCount(+e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium">Start Date</label>
        <input type="date" className="input" value={dateRange.start}
               onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
      </div>

      <div>
        <label className="block text-xs font-medium">End Date</label>
        <input type="date" className="input" value={dateRange.end}
               onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
      </div>

      <div>
        <button className="btn btn-primary mt-4" onClick={handleRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="ml-4 text-sm">
        {lastRefreshed && !error && <span className="text-green-600">Last refreshed: {lastRefreshed}</span>}
        {error && <span className="text-red-600">Error: {error}</span>}
      </div>
    </div>
  )
}
