import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

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
  const [error, setError] = useState<string | null>(null)

  // Environment-aware base path
  const baseURL =
    import.meta.env.MODE === "development"
      ? "/mockdata"
      : "/api"

  useEffect(() => {
    if (facilitySetup) {
      fetchPlan()
    }
  }, [facilitySetup])

  const fetchPlan = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      let url = ""
      if (baseURL === "/mockdata") {
        url = `${baseURL}/staffing-plan.json`
      } else {
        const query = new URLSearchParams({
          facility: facilitySetup.facility,
          department: facilitySetup.department,
          costCenter: facilitySetup.costCenter,
          bedCount: String(facilitySetup.bedCount),
          start: facilitySetup.dateRange.start,
          end: facilitySetup.dateRange.end,
        })
        url = `${baseURL}/staffing-plan?${query.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load staffing plan")

      const data = await res.json()
      setRows(data)
    } catch (err: any) {
      console.error("Failed to load staffing plan", err)
      setError(err.message || "Failed to load staffing plan")
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: PlanRow) => {
    try {
      if (!facilitySetup) return
      setError(null)

      if (baseURL === "/mockdata") {
        // Mock mode: update local state
        setRows((prev) =>
          row.id
            ? prev.map((r) => (r.id === row.id ? row : r))
            : [...prev, { ...row, id: Date.now() }]
        )
        return
      }

      const method = row.id ? "PUT" : "POST"
      const url = row.id
        ? `${baseURL}/staffing-plan/${row.id}`
        : `${baseURL}/staffing-plan`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      if (!res.ok) throw new Error("Failed to save staffing plan record")
      await fetchPlan()
    } catch (err: any) {
      console.error("Failed to save staffing plan row", err)
      setError(err.message || "Failed to save staffing plan record")
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup || !id) return
      setError(null)

      if (baseURL === "/mockdata") {
        // Mock mode: remove from local state
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      const res = await fetch(`${baseURL}/staffing-plan/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete staffing plan record")

      await fetchPlan()
    } catch (err: any) {
      console.error("Failed to delete staffing plan row", err)
      setError(err.message || "Failed to delete staffing plan record")
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Plan</h3>
        <Button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                department: facilitySetup?.department || "",
                shift: "",
                start: 0,
                end: 0,
                plannedFTE: 0,
              },
            ])
          }
        >
          + Add Plan
        </Button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded mb-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading staffing plan...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Department</th>
                <th className="px-3 py-2 border">Shift</th>
                <th className="px-3 py-2 border text-right">Start Hour</th>
                <th className="px-3 py-2 border text-right">End Hour</th>
                <th className="px-3 py-2 border text-right">Planned FTE</th>
                <th className="px-3 py-2 border text-center">Actions</th>
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
                  <tr
                    key={row.id || i}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {/* Department */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`department_${i}`}
                        label="Department"
                        type="text"
                        value={row.department}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, department: e.target.value }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Shift */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`shift_${i}`}
                        label="Shift"
                        type="text"
                        value={row.shift}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, shift: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Start Hour */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`start_${i}`}
                        label="Start Hour"
                        type="number"
                        min={0}
                        max={23}
                        value={row.start}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, start: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* End Hour */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`end_${i}`}
                        label="End Hour"
                        type="number"
                        min={0}
                        max={23}
                        value={row.end}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, end: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Planned FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`plannedFTE_${i}`}
                        label="Planned FTE"
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.plannedFTE}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? {
                                    ...r,
                                    plannedFTE: Number(e.target.value),
                                  }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-24 text-right"
                      />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
