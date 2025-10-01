import { useState, useEffect } from "react"

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
  const [rows, setRows] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all resources on mount
  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/resource-input")
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load resource input", err)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newRow: ResourceRow = {
      first_name: "",
      last_name: "",
      position: "",
      unit_fte: 1.0,
      availability: "Day",
      weekend_assignment: "",
      vacancy_status: "Filled",
    }
    setRows((prev) => [...prev, newRow])
  }

  const updateRow = (index: number, field: keyof ResourceRow, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const saveRow = async (row: ResourceRow) => {
    try {
      const method = row.id ? "PUT" : "POST"
      const url = row.id ? `/api/resource-input/${row.id}` : "/api/resource-input"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      })

      await fetchResources()
    } catch (err) {
      console.error("Failed to save resource row", err)
    }
  }

  const removeRow = async (id?: number, index?: number) => {
    try {
      if (id) {
        await fetch(`/api/resource-input/${id}`, { method: "DELETE" })
        await fetchResources()
      } else if (index !== undefined) {
        // remove unsaved row from UI only
        setRows((prev) => prev.filter((_, i) => i !== index))
      }
    } catch (err) {
      console.error("Failed to delete resource row", err)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Resource Input</h3>
        <button onClick={addRow} className="btn btn-primary">
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
                          updateRow(i, "first_name", e.target.value)
                        }
                        className="input w-full"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={row.last_name}
                        onChange={(e) =>
                          updateRow(i, "last_name", e.target.value)
                        }
                        className="input w-full"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.position}
                        onChange={(e) =>
                          updateRow(i, "position", e.target.value)
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
                          updateRow(i, "unit_fte", Number(e.target.value))
                        }
                        className="input w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        value={row.availability}
                        onChange={(e) =>
                          updateRow(i, "availability", e.target.value)
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
                          updateRow(i, "weekend_assignment", e.target.value)
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
                          updateRow(i, "vacancy_status", e.target.value)
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
