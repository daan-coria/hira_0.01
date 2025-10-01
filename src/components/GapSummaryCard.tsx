import { useState, useEffect } from "react"

type GapSummaryRow = {
  id?: number
  department: string
  shift: string
  available_fte: number
  required_fte: number
  gap?: number
}

export default function GapSummaryCard() {
  const [rows, setRows] = useState<GapSummaryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGapSummary()
  }, [])

  const fetchGapSummary = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/gap-summary")
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load gap summary", err)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newRow: GapSummaryRow = {
      department: "",
      shift: "",
      available_fte: 0,
      required_fte: 0,
    }
    setRows((prev) => [...prev, newRow])
  }

  const updateRow = (index: number, field: keyof GapSummaryRow, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const saveRow = async (row: GapSummaryRow) => {
    try {
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/gap-summary/${row.id}` : "/api/gap-summary"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      })

      await fetchGapSummary()
    } catch (err) {
      console.error("Failed to save gap summary row", err)
    }
  }

  const removeRow = async (id?: number, index?: number) => {
    try {
      if (id) {
        await fetch(`/api/gap-summary/${id}`, { method: "DELETE" })
        await fetchGapSummary()
      } else if (index !== undefined) {
        setRows((prev) => prev.filter((_, i) => i !== index))
      }
    } catch (err) {
      console.error("Failed to delete gap summary row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Gap Summary</h3>
        <button onClick={addRow} className="btn btn-primary">
          + Add Shift Gap
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading gap summary...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Department</th>
                <th className="px-3 py-2 border">Shift</th>
                <th className="px-3 py-2 border">Available FTE</th>
                <th className="px-3 py-2 border">Required FTE</th>
                <th className="px-3 py-2 border">Gap</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No gap summary records yet.
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
                        step="0.1"
                        value={row.available_fte}
                        onChange={(e) =>
                          updateRow(i, "available_fte", Number(e.target.value))
                        }
                        className="input w-24"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.required_fte}
                        onChange={(e) =>
                          updateRow(i, "required_fte", Number(e.target.value))
                        }
                        className="input w-24"
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {row.gap ?? (row.available_fte - row.required_fte)}
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
