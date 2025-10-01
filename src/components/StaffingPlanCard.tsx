import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"

type PlanRow = {
  id?: number
  department: string
  shift: string
  start: number
  end: number
  plannedFTE: number
}

export default function StaffingPlanCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilitySetup) {
      fetchPlan()
    }
  }, [facilitySetup])

  const fetchPlan = async () => {
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

      const res = await fetch(`/api/staffing-plan?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load staffing plan", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: PlanRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/staffing-plan/${row.id}` : "/api/staffing-plan"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchPlan()
    } catch (err) {
      console.error("Failed to save plan row", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/staffing-plan/${id}`, { method: "DELETE" })
        await fetchPlan()
      }
    } catch (err) {
      console.error("Failed to delete plan row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Plan</h3>
        <button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { department: facilitySetup?.department || "", shift: "", start: 0, end: 0, plannedFTE: 0 },
            ])
          }
          className="btn btn-primary"
        >
          + Add Plan
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading staffing plan...</p>
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
                    No staffing plan records yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
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
                      <input
                        type="text"
                        value={row.shift}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, shift: e.target.value } : r
                            )
                          )
                        }
                        className="input w-full"
                      />
                    </td>

                    {/* Start */}
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={row.start}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, start: Number(e.target.value) } : r
                            )
                          )
                        }
                        className="input w-20"
                      />
                    </td>

                    {/* End */}
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={row.end}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, end: Number(e.target.value) } : r
                            )
                          )
                        }
                        className="input w-20"
                      />
                    </td>

                    {/* Planned FTE */}
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.plannedFTE}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, plannedFTE: Number(e.target.value) } : r
                            )
                          )
                        }
                        className="input w-24"
                      />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
