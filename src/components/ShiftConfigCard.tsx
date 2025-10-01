import { useState, useEffect } from "react"

type ShiftConfigRow = {
  id?: number
  role: string
  shift: string
  hours: number
}

export default function ShiftConfigCard() {
  const [rows, setRows] = useState<ShiftConfigRow[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch existing shift configs
  useEffect(() => {
    fetchShiftConfig()
  }, [])

  const fetchShiftConfig = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/shift-config")
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load shift configuration", err)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newRow: ShiftConfigRow = {
      role: "",
      shift: "",
      hours: 0,
    }
    setRows((prev) => [...prev, newRow])
  }

  const updateRow = (index: number, field: keyof ShiftConfigRow, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const saveRow = async (row: ShiftConfigRow) => {
    try {
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/shift-config/${row.id}` : "/api/shift-config"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      })

      await fetchShiftConfig()
    } catch (err) {
      console.error("Failed to save shift config row", err)
    }
  }

  const removeRow = async (id?: number, index?: number) => {
    try {
      if (id) {
        await fetch(`/api/shift-config/${id}`, { method: "DELETE" })
        await fetchShiftConfig()
      } else if (index !== undefined) {
        setRows((prev) => prev.filter((_, i) => i !== index))
      }
    } catch (err) {
      console.error("Failed to delete shift config row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Shift Configuration</h3>
        <button onClick={addRow} className="btn btn-primary">
          + Add Shift Rule
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading shift configuration...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Shift</th>
                <th className="px-3 py-2 border">Hours</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No shift rules added yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    <td className="border px-2 py-1">
                      <select
                        value={row.role}
                        onChange={(e) =>
                          updateRow(i, "role", e.target.value)
                        }
                        className="input w-full"
                      >
                        <option value="">-- Select Role --</option>
                        <option value="RN">RN</option>
                        <option value="LPN">LPN</option>
                        <option value="CNA">CNA</option>
                        <option value="Clerk">Clerk</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.shift}
                        onChange={(e) =>
                          updateRow(i, "shift", e.target.value)
                        }
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
                        value={row.hours}
                        onChange={(e) =>
                          updateRow(i, "hours", Number(e.target.value))
                        }
                        className="input w-20"
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
