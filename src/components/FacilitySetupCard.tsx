import { useState } from "react"
import { useApp } from "@/store/AppContext"

type FacilitySetup = {
  facility: string
  department: string
  costCenter: string
  bedCount: number
  dateRange: { start: string; end: string }
}

export default function FacilitySetupCard() {
  const { dispatch } = useApp()

  const [facility, setFacility] = useState("")
  const [department, setDepartment] = useState("")
  const [costCenter, setCostCenter] = useState("")
  const [bedCount, setBedCount] = useState<number>(0)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  const handleSubmit = () => {
    if (!facility || !department || !costCenter || !dateRange.start || !dateRange.end) {
      alert("Please complete all fields")
      return
    }

    // Department determines tool type
    const toolType: "IP" | "ED" =
      department.toLowerCase().includes("ed") ? "ED" : "IP"

    const setup: FacilitySetup = {
      facility,
      department,
      costCenter,
      bedCount,
      dateRange,
    }

    // Save into global context
    dispatch({ type: "SET_SETUP", payload: { setup, toolType } })
  }

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Facility Setup</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Facility</label>
          <input
            type="text"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input"
          >
            <option value="">-- Select Department --</option>
            <option value="IP - Inpatient">Inpatient (IP)</option>
            <option value="ED - Emergency">Emergency (ED)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Cost Center</label>
          <input
            type="text"
            value={costCenter}
            onChange={(e) => setCostCenter(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Bed Count</label>
          <input
            type="number"
            value={bedCount}
            onChange={(e) => setBedCount(Number(e.target.value))}
            className="input"
          />
        </div>

        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <button onClick={handleSubmit} className="btn btn-primary mt-2">
          Refresh Data
        </button>
      </div>
    </div>
  )
}
