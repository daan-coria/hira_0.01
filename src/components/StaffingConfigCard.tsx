import { useState, useEffect } from "react"

type StaffingRequirementRow = {
  id?: number
  department: string
  shift: string
  start_hour: number
  end_hour: number
  planned_fte: number
}

export default function StaffingRequirementsCard() {
  const [rows, setRows] = useState<StaffingRequirementRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequirements()
  }, [])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/staffing-plan")
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load staffing requirements", err)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newRow: StaffingRequirementRow = {
      department: "",
      shift: "",
      start_hour: 0,
      end_hour: 0,
      planned_fte: 0,
    }
    setRows((prev) => [...prev, newRow])
  }

  const updateRow = (index: number, field: keyof StaffingRequirementRow, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const saveRow = async (row: StaffingRequirementRow) => {
    try {
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/staffing-plan/${row.id}` : "/api/staffing-plan"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      })

      await fetchRequirements()
    } catch (err) {
      console.error("Failed to save staffing requirement row", err)
    }
  }

  const removeRow = async (id?: number, index?: number) => {
    try {
      if (id) {
        await fetch(`/api/staffing-plan/${id}`, { method: "DELETE" })
        await fetchRequirements()
      } else if (index !== undefined) {
        setRows((prev) => prev.filter((_, i) => i !== index))
      }
    } catch (err) {
      console.error("Failed to delete staffing requirement row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Requirements</h3>
        <button onClick={addRow} className="btn btn-primary">
          + Add Requirement
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading staffing requirements...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Department</th>
                <th className="px-3 py-2 border">Shift</th>
                <th className="px-3 py-2 border">Start Hour</th>
                <th className="px-3 py-2 border">End Hour</th>
                <th className="px-3 py-2 border">Planned FTE</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No staffing requirements added yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={row.department}
                        onChange={(e) => updateRow(i, "department", e.target.value)}
                        className="input w-full"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.shift}
                        onChange={(e) => updateRow(i, "shift", e.target.value)}
                        className="input w-full"
                      >
                        <option value="">-- Select Shift --</option>
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={row.start_hour}
                        onChange={(e) =>
                          updateRow(i, "start_hour", Number(e.target.value))
                        }
                        className="input w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={row.end_hour}
                        onChange={(e) =>
                          updateRow(i, "end_hour", Number(e.target.value))
                        }
                        className="input w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.planned_fte}
                        onChange={(e) =>
                          updateRow(i, "planned_fte", Number(e.target.value))
                        }
                        className="input w-24"
                      />
                    </td>
                    <td className="border px-2 py-1 text-center space-x-2">
                      <button
                        onClick={() => saveRow(row)}
                        className="btn btn-sm btn-success"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => removeRow(row.id, i)}
                        className="btn btn-sm btn-danger"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
