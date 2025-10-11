import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

type ShiftConfigRow = {
  id?: number
  role: string
  shift_label: string
  start_hour: number
  end_hour: number
  hours_per_shift: number
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function ShiftConfigCard({ onNext, onPrev }: Props) {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<ShiftConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  useEffect(() => {
    if (facilitySetup) fetchShiftConfigs()
  }, [facilitySetup])

  const fetchShiftConfigs = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      const url = `${baseURL}/shift-config.json`
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

  const saveRow = (row: ShiftConfigRow) => {
    setRows((prev) =>
      row.id
        ? prev.map((r) => (r.id === row.id ? row : r))
        : [...prev, { ...row, id: Date.now() }]
    )
  }

  const removeRow = (id?: number) => {
    if (!id) return
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Shift Configuration
        </h3>
        <Button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                role: "",
                shift_label: "",
                start_hour: 7,
                end_hour: 19,
                hours_per_shift: 12,
              },
            ])
          }
        >
          + Add Shift
        </Button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading shift configurations...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Shift Label</th>
                <th className="px-3 py-2 border text-right">Start Hour</th>
                <th className="px-3 py-2 border text-right">End Hour</th>
                <th className="px-3 py-2 border text-right">Hours / Shift</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
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
                              idx === i
                                ? { ...r, role: e.target.value }
                                : r
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

                    {/* Shift Label */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`shift_label_${i}`}
                        label=""
                        type="text"
                        value={row.shift_label}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, shift_label: e.target.value }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Start Hour */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`start_hour_${i}`}
                        label=""
                        type="number"
                        min={0}
                        max={23}
                        value={row.start_hour}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? {
                                    ...r,
                                    start_hour: Number(e.target.value),
                                  }
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
                        id={`end_hour_${i}`}
                        label=""
                        type="number"
                        min={0}
                        max={23}
                        value={row.end_hour}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? {
                                    ...r,
                                    end_hour: Number(e.target.value),
                                  }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Hours per Shift */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`hours_per_shift_${i}`}
                        label=""
                        type="number"
                        min={1}
                        max={24}
                        value={row.hours_per_shift}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? {
                                    ...r,
                                    hours_per_shift: Number(e.target.value),
                                  }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
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
