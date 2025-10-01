import { useState } from "react"
import { useApp } from "@/store/AppContext"

export default function FacilityHeader() {
  const { setFacilitySetup, setToolType } = useApp()

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

    const toolType = department.toLowerCase().includes("ed") ? "ED" : "IP"
    setToolType(toolType)
    setFacilitySetup({ facility, department, costCenter, bedCount, dateRange })
  }

  return (
    <div className="card mb-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">HIRA Staffing Tool</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Facility */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Facility</label>
          <input
            type="text"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            className="input w-full border rounded-lg px-3 py-2"
            placeholder="Facility name"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input w-full border rounded-lg px-3 py-2"
          >
            <option value="">-- Select Department --</option>
            <option value="IP - Inpatient">Inpatient (IP)</option>
            <option value="ED - Emergency">Emergency (ED)</option>
          </select>
        </div>

        {/* Cost Center */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Cost Center</label>
          <input
            type="text"
            value={costCenter}
            onChange={(e) => setCostCenter(e.target.value)}
            className="input w-full border rounded-lg px-3 py-2"
            placeholder="e.g. CC1234"
          />
        </div>

        {/* Bed Count */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Bed Count</label>
          <input
            type="number"
            value={bedCount}
            onChange={(e) => setBedCount(Number(e.target.value))}
            className="input w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="input w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="input w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={handleSubmit} className="btn">
          Refresh Data
        </button>
      </div>
    </div>
  )
}
