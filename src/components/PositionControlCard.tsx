import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

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
  const [error, setError] = useState<string | null>(null)

  // Environment-aware base path
  const baseURL =
    import.meta.env.MODE === "development"
      ? "/mockdata"
      : "/api"

  useEffect(() => {
    if (facilitySetup) {
      fetchPositions()
    }
  }, [facilitySetup])

  const fetchPositions = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      let url = ""
      if (baseURL === "/mockdata") {
        url = `${baseURL}/position-control.json`
      } else {
        const query = new URLSearchParams({
          facility: facilitySetup.facility,
          department: facilitySetup.department,
          costCenter: facilitySetup.costCenter,
          bedCount: String(facilitySetup.bedCount),
          start: facilitySetup.dateRange?.start || "",
          end: facilitySetup.dateRange?.end || "",
        })

        url = `${baseURL}/position-control?${query.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load position control")

      const data = await res.json()
      setRows(data)
    } catch (err: any) {
      console.error("Failed to load position control", err)
      setError(err.message || "Failed to load position control")
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: PositionControlRow) => {
    try {
      if (!facilitySetup) return
      setError(null)

      if (baseURL === "/mockdata") {
        // Mock save — just update local state
        setRows((prev) =>
          row.id
            ? prev.map((r) => (r.id === row.id ? row : r))
            : [...prev, { ...row, id: Date.now() }]
        )
        return
      }

      const method = row.id ? "PUT" : "POST"
      const url = row.id
        ? `${baseURL}/position-control/${row.id}`
        : `${baseURL}/position-control`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      if (!res.ok) throw new Error("Failed to save position row")
      await fetchPositions()
    } catch (err: any) {
      console.error("Failed to save position row", err)
      setError(err.message || "Failed to save position row")
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup || !id) return
      setError(null)

      if (baseURL === "/mockdata") {
        // Mock delete — remove from local state
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      const res = await fetch(`${baseURL}/position-control/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete position row")

      await fetchPositions()
    } catch (err: any) {
      console.error("Failed to delete position row", err)
      setError(err.message || "Failed to delete position row")
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Position Control</h3>
        <Button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { role: "", budgeted_fte: 0, filled_fte: 0, open_fte: 0 },
            ])
          }
        >
          + Add Position
        </Button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded mb-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading position control...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border text-right">Budgeted FTE</th>
                <th className="px-3 py-2 border text-right">Filled FTE</th>
                <th className="px-3 py-2 border text-right">Open FTE</th>
                <th className="px-3 py-2 border text-center">Actions</th>
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
                    <tr
                      key={row.id || i}
                      className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {/* Role */}
                      <td className="border px-2 py-1">
                        <Select
                          id={`role_${i}`}
                          label="Role"
                          value={row.role}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, role: e.target.value } : r
                              )
                            )
                          }
                          className="!m-0 !p-1"
                        >
                          <option value="">-- Select Role --</option>
                          <option value="RN">RN</option>
                          <option value="LPN">LPN</option>
                          <option value="CNA">CNA</option>
                          <option value="Clerk">Clerk</option>
                        </Select>
                      </td>

                      {/* Budgeted FTE */}
                      <td className="border px-2 py-1 text-right">
                        <Input
                          id={`budgeted_${i}`}
                          label="Budgeted FTE"
                          type="number"
                          min={0}
                          step={0.1}
                          value={row.budgeted_fte}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? {
                                      ...r,
                                      budgeted_fte: Number(e.target.value),
                                    }
                                  : r
                              )
                            )
                          }
                          className="!m-0 !p-1 w-24 text-right"
                        />
                      </td>

                      {/* Filled FTE */}
                      <td className="border px-2 py-1 text-right">
                        <Input
                          id={`filled_${i}`}
                          label="Filled FTE"
                          type="number"
                          min={0}
                          step={0.1}
                          value={row.filled_fte}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? {
                                      ...r,
                                      filled_fte: Number(e.target.value),
                                    }
                                  : r
                              )
                            )
                          }
                          className="!m-0 !p-1 w-24 text-right"
                        />
                      </td>

                      {/* Open FTE (calculated) */}
                      <td
                        className={`border px-2 py-1 text-right font-semibold ${
                          openFTE > 0 ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {openFTE.toFixed(1)}
                      </td>

                      {/* Actions */}
                      <td className="border px-2 py-1 text-center space-x-2">
                        <Button
                          onClick={() => saveRow(row)}
                          variant="primary"
                          className="!px-2 !py-1 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => removeRow(row.id)}
                          variant="ghost"
                          className="!px-2 !py-1 text-xs text-red-600"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
