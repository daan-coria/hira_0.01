import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Loading from "@/components/ui/Loading"
import ErrorBanner from "@/components/ui/ErrorBanner"

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
  const { facilitySetup } = state

  const [rows, setRows] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Base URL automatically switches between mock data (dev) and real API (prod)
  const baseURL =
    import.meta.env.MODE === "development"
      ? "/mockdata"
      : "/api"

  useEffect(() => {
    if (facilitySetup) {
      fetchResources()
    }
  }, [facilitySetup])

  const fetchResources = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      let url = ""
      if (baseURL === "/mockdata") {
        // Local mock file
        url = `${baseURL}/resource-input.json`
      } else {
        // Real API mode
        const query = new URLSearchParams({
          facility: facilitySetup.facility,
          department: facilitySetup.department,
          costCenter: facilitySetup.costCenter,
          bedCount: String(facilitySetup.bedCount),
          start: facilitySetup.dateRange.start,
          end: facilitySetup.dateRange.end,
        })
        url = `${baseURL}/resource-input?${query.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch resource input data")

      const data = await res.json()
      setRows(data)
    } catch (err: any) {
      console.error("Failed to load resource input", err)
      setError(err.message || "Failed to load resource input")
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: ResourceRow) => {
    try {
      if (!facilitySetup) return
      setError(null)

      // In dev (mock) mode, just update state locally
      if (baseURL === "/mockdata") {
        setRows((prev) =>
          row.id
            ? prev.map((r) => (r.id === row.id ? row : r))
            : [...prev, { ...row, id: Date.now() }]
        )
        return
      }

      const method = row.id ? "PUT" : "POST"
      const url = row.id
        ? `${baseURL}/resource-input/${row.id}`
        : `${baseURL}/resource-input`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      if (!res.ok) throw new Error("Failed to save resource row")
      await fetchResources()
    } catch (err: any) {
      console.error("Failed to save resource row", err)
      setError(err.message || "Failed to save resource row")
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup || !id) return
      setError(null)

      // In dev (mock) mode, remove locally
      if (baseURL === "/mockdata") {
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      const res = await fetch(`${baseURL}/resource-input/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete resource row")

      await fetchResources()
    } catch (err: any) {
      console.error("Failed to delete resource row", err)
      setError(err.message || "Failed to delete resource row")
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Resource Input</h3>
        <Button
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
        >
          + Add Resource
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Loading message="Loading resources..." />
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
                    {/* First Name */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`first_name_${i}`}
                        label=""
                        type="text"
                        value={row.first_name}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, first_name: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Last Name */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`last_name_${i}`}
                        label=""
                        type="text"
                        value={row.last_name}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, last_name: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Position */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`position_${i}`}
                        label=""
                        value={row.position}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, position: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select --</option>
                        <option value="RN">RN</option>
                        <option value="LPN">LPN</option>
                        <option value="CNA">CNA</option>
                        <option value="Clerk">Clerk</option>
                      </Select>
                    </td>

                    {/* Unit FTE */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`fte_${i}`}
                        label=""
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
                        className="!m-0 !p-1 w-20"
                      />
                    </td>

                    {/* Availability */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`availability_${i}`}
                        label=""
                        value={row.availability}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, availability: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                      </Select>
                    </td>

                    {/* Weekend Group */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`weekend_${i}`}
                        label=""
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
                        className="!m-0 !p-1"
                      >
                        <option value="">--</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="WC">WC</option>
                      </Select>
                    </td>

                    {/* Vacancy Status */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`vacancy_${i}`}
                        label=""
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
                        className="!m-0 !p-1"
                      >
                        <option value="Filled">Filled</option>
                        <option value="Vacant">Vacant</option>
                        <option value="Open Req">Open Req</option>
                      </Select>
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
