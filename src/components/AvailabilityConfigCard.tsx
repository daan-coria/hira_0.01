import { useEffect, useState } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

type AvailabilityRow = {
  id?: number
  staff_name: string
  weekend_group: string
  pto_days: number
  loa_days: number
  available_shifts: number
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function AvailabilityConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()

  const [rows, setRows] = useState<AvailabilityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load existing data or map from resourceInput
  useEffect(() => {
    try {
      setLoading(true)
      setError(null)

      if (data.availabilityConfig.length > 0) {
        // If already edited before, load from global
        setRows(data.availabilityConfig)
      } else if (data.resourceInput.length > 0) {
        // Map staff names from ResourceInput
        const mapped = data.resourceInput.map((r, i) => ({
          id: i + 1,
          staff_name: `${r.first_name} ${r.last_name}`.trim(),
          weekend_group: r.weekend_group || "",
          pto_days: 0,
          loa_days: 0,
          available_shifts: 10,
        }))
        setRows(mapped)
        updateData("availabilityConfig", mapped)
      } else {
        setRows([])
      }
    } catch (err: any) {
      console.error("Failed to load availability config", err)
      setError(err.message || "Failed to load availability config")
    } finally {
      setLoading(false)
    }
  }, [data.resourceInput])

  // Save local + global
  const saveRow = (row: AvailabilityRow) => {
    const updated = row.id
      ? rows.map((r) => (r.id === row.id ? row : r))
      : [...rows, { ...row, id: Date.now() }]
    setRows(updated)
    updateData("availabilityConfig", updated)
  }

  const removeRow = (id?: number) => {
    if (!id) return
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("availabilityConfig", updated)
  }

  // Add new staff manually
  const addRow = () => {
    const updated = [
      ...rows,
      {
        id: Date.now(),
        staff_name: "",
        weekend_group: "",
        pto_days: 0,
        loa_days: 0,
        available_shifts: 0,
      },
    ]
    setRows(updated)
    updateData("availabilityConfig", updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Resource Availability
        </h3>
        <Button onClick={addRow}>+ Add Resource</Button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading availability data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-left">Staff Name</th>
                <th className="px-3 py-2 border text-center">Weekend Group</th>
                <th className="px-3 py-2 border text-center">PTO Days</th>
                <th className="px-3 py-2 border text-center">LOA Days</th>
                <th className="px-3 py-2 border text-center">
                  Available Shifts
                </th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-4 text-gray-500"
                  >
                    No staff listed. Please add or return to Resource Input.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    {/* Staff Name */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`staff_name_${i}`}
                        label=""
                        value={row.staff_name}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, staff_name: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("availabilityConfig", updated)
                        }}
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Weekend Group */}
                    <td className="border px-2 py-1 text-center">
                      <Select
                        id={`weekend_${i}`}
                        label=""
                        value={row.weekend_group}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, weekend_group: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("availabilityConfig", updated)
                        }}
                        className="!m-0 !p-1"
                      >
                        <option value="">--</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="WC">WC</option>
                      </Select>
                    </td>

                    {/* PTO Days */}
                    <td className="border px-2 py-1 text-center">
                      <Input
                        id={`pto_${i}`}
                        label=""
                        type="number"
                        min="0"
                        value={row.pto_days}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, pto_days: Number(e.target.value) }
                              : r
                          )
                          setRows(updated)
                          updateData("availabilityConfig", updated)
                        }}
                        className="!m-0 !p-1 w-16 text-center"
                      />
                    </td>

                    {/* LOA Days */}
                    <td className="border px-2 py-1 text-center">
                      <Input
                        id={`loa_${i}`}
                        label=""
                        type="number"
                        min="0"
                        value={row.loa_days}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, loa_days: Number(e.target.value) }
                              : r
                          )
                          setRows(updated)
                          updateData("availabilityConfig", updated)
                        }}
                        className="!m-0 !p-1 w-16 text-center"
                      />
                    </td>

                    {/* Available Shifts */}
                    <td className="border px-2 py-1 text-center">
                      <Input
                        id={`avail_${i}`}
                        label=""
                        type="number"
                        min="0"
                        value={row.available_shifts}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? {
                                  ...r,
                                  available_shifts: Number(e.target.value),
                                }
                              : r
                          )
                          setRows(updated)
                          updateData("availabilityConfig", updated)
                        }}
                        className="!m-0 !p-1 w-16 text-center"
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

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onPrev}>
          ← Previous
        </Button>
        <Button variant="primary" onClick={onNext}>
          Next →
        </Button>
      </div>
    </Card>
  )
}
