import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"

type ResourceRow = {
  id?: number
  first_name: string
  last_name: string
  position: string
  unit_fte: number
  availability: string
  weekend_assignment: string
  vacancy_status: string
}

export default function ResourceInputCard() {
  const { state } = useApp()
  const [rows, setRows] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)

  const { facilitySetup } = state

  useEffect(() => {
    if (facilitySetup) {
      fetchResources()
    }
  }, [facilitySetup])

  const fetchResources = async () => {
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

      const res = await fetch(`/api/resource-input?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load resource input", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: ResourceRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/resource-input/${row.id}` : "/api/resource-input"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchResources()
    } catch (err) {
      console.error("Failed to save resource row", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/resource-input/${id}`, { method: "DELETE" })
        await fetchResources()
      }
    } catch (err) {
      console.error("Failed to delete resource row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Resource Input</h3>
        <button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                first_name: "",
                last_name: "",
                position: "",
                unit_fte: 1.0,
                availability: "Day",
                weekend_assignment: "",
                vacancy_status: "Filled",
              },
            ])
          }
          className="btn btn-primary"
        >
          + Add Resource
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading resources...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">First Name</th>
                <th className="px-3 py-2 border">Last Name</th>
                <th className="px-3 py-2 border">Position</th>
                <th className="px-3 py-2 border">Unit FTE</th>
                <th className="px-3 py-2 border">Availability</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border">Vacancy Status</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No resources added yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={row.first_name}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, first_name: e.target.value } : r
                            )
                          )
                        }
                        className="input w-full"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={row.last_name}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, last_name: e.target.value } : r
                            )
                          )
                        }
                        className="input w-full"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.position}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, position: e.target.value } : r
                            )
                          )
                        }
                        className="input w-full"
                      >
                        <option value="">-- Select --</option>
                        <option value="RN">RN</option>
                        <option value="LPN">LPN</option>
                        <option value="CNA">CNA</option>
                        <option value="Clerk">Clerk</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.unit_fte}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, unit_fte: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="input w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.availability}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, availability: e.target.value }
                                : r
                            )
                          )
                        }
                        className="input w-full"
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.weekend_assignment}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, weekend_assignment: e.target.value }
                                : r
                            )
                          )
                        }
                        className="input w-full"
                      >
                        <option value="">--</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="WC">WC</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.vacancy_status}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, vacancy_status: e.target.value }
                                : r
                            )
                          )
                        }
                        className="input w-full"
                      >
                        <option value="Filled">Filled</option>
                        <option value="Vacant">Vacant</option>
                        <option value="Open Req">Open Req</option>
                      </select>
                    </td>
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
