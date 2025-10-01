import { useState } from "react"

type StaffingRequirementRow = {
  id: number
  position: string
  desiredFTE: number
}

export default function StaffingRequirementsCard() {
  const [rows, setRows] = useState<StaffingRequirementRow[]>([])

  const addRow = () => {
    const newRow: StaffingRequirementRow = {
      id: Date.now(),
      position: "",
      desiredFTE: 0,
    }
    setRows((prev) => [...prev, newRow])
  }

  const updateRow = (
    id: number,
    field: keyof StaffingRequirementRow,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Requirements</h3>
        <button onClick={addRow} className="btn btn-primary">
          + Add Requirement
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 border">Position</th>
              <th className="px-3 py-2 border">Desired FTE</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  No staffing requirements added yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="border px-2 py-1">
                    <select
                      value={row.position}
                      onChange={(e) =>
                        updateRow(row.id, "position", e.target.value)
                      }
                      className="input w-full"
                    >
                      <option value="">-- Select Position --</option>
                      <option value="RN">RN</option>
                      <option value="LPN">LPN</option>
                      <option value="CNA">CNA</option>
                      <option value="Clerk">Clerk</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={row.desiredFTE}
                      onChange={(e) =>
                        updateRow(row.id, "desiredFTE", Number(e.target.value))
                      }
                      className="input w-24"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
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
    </div>
  )
}
