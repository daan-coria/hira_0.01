import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"

type GapSummaryRow = {
  id?: number
  department: string
  shift: string
  available_fte: number
  required_fte: number
  gap?: number
}

export default function GapSummaryCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<GapSummaryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilitySetup) {
      fetchGapSummary()
    }
  }, [facilitySetup])

  const fetchGapSummary = async () => {
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

      const res = await fetch(`/api/gap-summary?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load gap summary", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: GapSummaryRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/gap-summary/${row.id}` : "/api/gap-summary"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchGapSummary()
    } catch (err) {
      console.error("Failed to save gap summary row", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/gap-summary/${id}`, { method: "DELETE" })
        await fetchGapSummary()
      }
    } catch (err) {
      console.error("Failed to delete gap summary row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Gap Summary</h3>
        <button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                department: facilitySetup?.department || "",
                shift: "",
                available_fte: 0,
                required_fte: 0,
              },
            ])
          }
          className="btn btn-primary"
        >
          + Add Gap Record
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
                rows.map((row, i) => {
                  const gapValue =
                    row.gap !== undefined
                      ? row.gap
                      : row.available_fte - row.required_fte
                  return (
                    <tr key={row.id || i}>
                      {/* Department */}
                      <td className="border px-2 py-1">
                        <input
                          type="text"
                          value={row.department}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, department: e.target.value } : r
                              )
                            )
                          }
                          className="input w-full"
                        />
                      </td>

                      {/* Shift */}
                      <td className="border px-2 py-1">
                        <select
                          value={row.shift}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, shift: e.target.value } : r
                              )
                            )
                          }
                          className="input w-full"
                        >
                          <option value="">-- Select Shift --</option>
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                          <option value="Evening">Evening</option>
                        </select>
                      </td>

                      {/* Available FTE */}
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={row.available_fte}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? { ...r, available_fte: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                          className="input w-24"
                        />
                      </td>

                      {/* Required FTE */}
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={row.required_fte}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? { ...r, required_fte: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                          className="input w-24"
                        />
                      </td>

                      {/* Gap (calculated) */}
                      <td className="border px-2 py-1 text-center">
                        {gapValue}
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
