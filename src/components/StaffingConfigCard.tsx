import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"

type StaffingConfigRow = {
  id?: number
  role: string
  ratio_mode: "Ratio" | "Fixed"
  max_ratio: number
  include_in_ratio: boolean
  direct_care_percent: number
  category: string
}

export default function StaffingConfigCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<StaffingConfigRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilitySetup) {
      fetchConfigs()
    }
  }, [facilitySetup])

  const fetchConfigs = async () => {
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

      const res = await fetch(`/api/staffing-config?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load staffing configuration", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: StaffingConfigRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/staffing-config/${row.id}` : "/api/staffing-config"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchConfigs()
    } catch (err) {
      console.error("Failed to save staffing config row", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/staffing-config/${id}`, { method: "DELETE" })
        await fetchConfigs()
      }
    } catch (err) {
      console.error("Failed to delete staffing config row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Configuration</h3>
        <button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                role: "",
                ratio_mode: "Ratio",
                max_ratio: 0,
                include_in_ratio: true,
                direct_care_percent: 0,
                category: "",
              },
            ])
          }
          className="btn btn-primary"
        >
          + Add Config
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading staffing configuration...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Ratio / Fixed</th>
                <th className="px-3 py-2 border">Max Ratio</th>
                <th className="px-3 py-2 border">Include in Ratio</th>
                <th className="px-3 py-2 border">Direct Care %</th>
                <th className="px-3 py-2 border">Category</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No staffing configs added yet.
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

                    {/* Ratio / Fixed */}
                    <td className="border px-2 py-1">
                      <select
                        value={row.ratio_mode}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, ratio_mode: e.target.value as "Ratio" | "Fixed" }
                                : r
                            )
                          )
                        }
                        className="input w-full"
                      >
                        <option value="Ratio">Ratio</option>
                        <option value="Fixed">Fixed</option>
                      </select>
                    </td>

                    {/* Max Ratio */}
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.max_ratio}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, max_ratio: Number(e.target.value) } : r
                            )
                          )
                        }
                        className="input w-20"
                      />
                    </td>

                    {/* Include in Ratio */}
                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={row.include_in_ratio}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, include_in_ratio: e.target.checked } : r
                            )
                          )
                        }
                      />
                    </td>

                    {/* Direct Care % */}
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.direct_care_percent}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, direct_care_percent: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="input w-20"
                      />
                    </td>

                    {/* Category */}
                    <td className="border px-2 py-1">
                      <select
                        value={row.category}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, category: e.target.value } : r
                            )
                          )
                        }
                        className="input w-full"
                      >
                        <option value="">-- Select Category --</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Support">Support</option>
                        <option value="Other">Other</option>
                      </select>
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
