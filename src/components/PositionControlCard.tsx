import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"

type PositionControlRow = {
  id?: number
  role: string
  budgeted_fte: number
  filled_fte: number
  open_fte?: number // calculated = budgeted - filled
}

export default function PositionControlCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<PositionControlRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilitySetup) {
      fetchPositions()
    }
  }, [facilitySetup])

  const fetchPositions = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)

      const query = new URLSearchParams({
        facility: facilitySetup.facility,
        department: facilitySetup.department,
        costCenter: facilitySetup.costCenter,
        bedCount: String(facilitySetup.bedCount),
        start: facilitySetup.dateRange.start,
        end: facilitySetup.dateRange.end,
      })

      const res = await fetch(`/api/position-control?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load position control", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: PositionControlRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/position-control/${row.id}` : "/api/position-control"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchPositions()
    } catch (err) {
      console.error("Failed to save position row", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/position-control/${id}`, { method: "DELETE" })
        await fetchPositions()
      }
    } catch (err) {
      console.error("Failed to delete position row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Position Control</h3>
        <button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { role: "", budgeted_fte: 0, filled_fte: 0, open_fte: 0 },
            ])
          }
          className="btn btn-primary"
        >
          + Add Position
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading position control...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Budgeted FTE</th>
                <th className="px-3 py-2 border">Filled FTE</th>
                <th className="px-3 py-2 border">Open FTE</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No positions defined yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const openFTE = row.budgeted_fte - row.filled_fte
                  return (
                    <tr key={row.id || i}>
                      {/* Role */}
                      <td className="border px-2 py-1">
                        <select
                          value={row.role}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, role: e.target.value } : r
                              )
                            )
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

                      {/* Budgeted FTE */}
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={row.budgeted_fte}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? { ...r, budgeted_fte: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                          className="input w-24"
                        />
                      </td>

                      {/* Filled FTE */}
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={row.filled_fte}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? { ...r, filled_fte: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                          className="input w-24"
                        />
                      </td>

                      {/* Open FTE (calculated) */}
                      <td className="border px-2 py-1 text-center">
                        {openFTE}
                      </td>

                      {/* Actions */}
                      <td className="border px-2 py-1 text-center space-x-2">
                        <button
                          onClick={() => saveRow(row)}
                          className="btn btn-sm btn-success"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => removeRow(row.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
