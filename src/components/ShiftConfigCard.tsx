import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Loading from "@/components/ui/Loading"
import ErrorBanner from "@/components/ui/ErrorBanner"

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
  const [error, setError] = useState<string | null>(null)

  // Automatically switch between mock JSON and real API
  const baseURL =
    import.meta.env.MODE === "development"
      ? "/mockdata"
      : "/api"

  useEffect(() => {
    if (facilitySetup) {
      fetchShiftConfigs()
    }
  }, [facilitySetup])

  const fetchShiftConfigs = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      let url = ""
      if (baseURL === "/mockdata") {
        url = `${baseURL}/shift-config.json`
      } else {
        const query = new URLSearchParams({
          facility: facilitySetup.facility,
          department: facilitySetup.department,
          costCenter: facilitySetup.costCenter,
          bedCount: String(facilitySetup.bedCount),
          start: facilitySetup.dateRange.start,
          end: facilitySetup.dateRange.end,
        })
        url = `${baseURL}/shift-config?${query.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load shift configurations")

      const data = await res.json()
      setRows(data)
    } catch (err: any) {
      console.error("Failed to load shift configs", err)
      setError(err.message || "Failed to load shift configurations")
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: ShiftConfigRow) => {
    try {
      if (!facilitySetup) return
      setError(null)

      if (baseURL === "/mockdata") {
        // local mock mode
        setRows((prev) =>
          row.id
            ? prev.map((r) => (r.id === row.id ? row : r))
            : [...prev, { ...row, id: Date.now() }]
        )
        return
      }

      const method = row.id ? "PUT" : "POST"
      const url = row.id
        ? `${baseURL}/shift-config/${row.id}`
        : `${baseURL}/shift-config`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      if (!res.ok) throw new Error("Failed to save shift configuration")
      await fetchShiftConfigs()
    } catch (err: any) {
      console.error("Failed to save shift row", err)
      setError(err.message || "Failed to save shift configuration")
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup || !id) return
      setError(null)

      if (baseURL === "/mockdata") {
        // local mock mode
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      const res = await fetch(`${baseURL}/shift-config/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete shift configuration")

      await fetchShiftConfigs()
    } catch (err: any) {
      console.error("Failed to delete shift row", err)
      setError(err.message || "Failed to delete shift configuration")
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Shift Configuration</h3>
        <Button
          onClick={() =>
            setRows((prev) => [...prev, { role: "", shift: "", hours: 8 }])
          }
        >
          + Add Shift
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Loading message="Loading shift configurations..." />
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
                      <Select
                        id={`role_${i}`}
                        label=""
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

                    {/* Shift */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`shift_${i}`}
                        label=""
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

                    {/* Hours */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`hours_${i}`}
                        label=""
                        type="number"
                        min={1}
                        step={1}
                        value={row.hours}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, hours: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20"
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
