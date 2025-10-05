import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"

type AvailabilityRow = {
  id?: number
  staff_name: string
  weekend_group: string
  pto_days: number
  loa_days: number
  available_shifts: number
}

export default function AvailabilityConfigCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<AvailabilityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilitySetup) fetchAvailability()
  }, [facilitySetup])

  const fetchAvailability = async () => {
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

      const res = await fetch(`/api/availability-config?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load availability data", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: AvailabilityRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id
        ? `/api/availability-config/${row.id}`
        : "/api/availability-config"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchAvailability()
    } catch (err) {
      console.error("Failed to save availability row", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/availability-config/${id}`, { method: "DELETE" })
        await fetchAvailability()
      }
    } catch (err) {
      console.error("Failed to delete availability row", err)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Resource Availability</h3>
        <Button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                staff_name: "",
                weekend_group: "",
                pto_days: 0,
                loa_days: 0,
                available_shifts: 0,
              },
            ])
          }
        >
          + Add Resource
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading availability...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Staff Name</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border">PTO Days</th>
                <th className="px-3 py-2 border">LOA Days</th>
                <th className="px-3 py-2 border">Available Shifts</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No availability data yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    <td className="border px-2 py-1">
                      <Input
                        id={`staff_${i}`}
                        label=""
                        value={row.staff_name}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, staff_name: e.target.value }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Select
                        id={`weekend_${i}`}
                        label=""
                        value={row.weekend_group}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, weekend_group: e.target.value }
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
                    <td className="border px-2 py-1">
                      <Input
                        id={`pto_${i}`}
                        label=""
                        type="number"
                        min={0}
                        value={row.pto_days}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, pto_days: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        id={`loa_${i}`}
                        label=""
                        type="number"
                        min={0}
                        value={row.loa_days}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, loa_days: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        id={`avail_${i}`}
                        label=""
                        type="number"
                        min={0}
                        value={row.available_shifts}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, available_shifts: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20"
                      />
                    </td>
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
