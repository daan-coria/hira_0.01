import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"

type ShiftConfigRow = {
  id?: number
  role: string
  shift: string
  hours: number
}

export default function ShiftConfigCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<ShiftConfigRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilitySetup) {
      fetchShiftConfigs()
    }
  }, [facilitySetup])

  const fetchShiftConfigs = async () => {
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

      const res = await fetch(`/api/shift-config?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load shift configs", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: ShiftConfigRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/shift-config/${row.id}` : "/api/shift-config"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchShiftConfigs()
    } catch (err) {
      console.error("Failed to save shift row", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/shift-config/${id}`, { method: "DELETE" })
        await fetchShiftConfigs()
      }
    } catch (err) {
      console.error("Failed to delete shift row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Shift Configuration</h3>
        <button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { role: "", shift: "", hours: 8 },
            ])
          }
          className="btn btn-primary"
        >
          + Add Shift
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading shift configs...</p>
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
                    No shifts defined yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
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

                    {/* Hours */}
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={row.hours}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, hours: Number(e.target.value) } : r
                            )
                          )
                        }
                        className="input w-20"
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
