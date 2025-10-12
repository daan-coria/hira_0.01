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
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ShiftConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  // Standard shift templates for autofill
  const shiftTemplates: Record<
    string,
    { start: number; end: number; hours: number }
  > = {
    Day: { start: 7, end: 19, hours: 12 },
    Evening: { start: 15, end: 23, hours: 8 },
    Night: { start: 19, end: 7, hours: 12 },
  }

  // Load from context or fetch once
  useEffect(() => {
    if (data.shiftConfig && data.shiftConfig.length > 0) {
      setRows(data.shiftConfig)
      setLoading(false)
    } else {
      fetchShiftConfigs()
    }
  }, [])

  const fetchShiftConfigs = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${baseURL}/shift-config.json`)
      if (!res.ok) throw new Error("Failed to load shift configurations")
      const json = await res.json()
      setRows(json)
      updateData("shiftConfig", json)
    } catch (err: any) {
      console.error("Failed to load shift configs", err)
      setError(err.message || "Failed to load shift configurations")
    } finally {
      setLoading(false)
    }
  }

  const calculateHours = (start: number, end: number): number => {
    const diff = end >= start ? end - start : 24 - start + end
    return diff === 0 ? 24 : diff
  }

  const saveRow = (row: ShiftConfigRow) => {
    const updated = row.id
      ? rows.map((r) => (r.id === row.id ? row : r))
      : [...rows, { ...row, id: Date.now() }]
    setRows(updated)
    updateData("shiftConfig", updated)
  }

  const removeRow = (id?: number) => {
    if (!id) return
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("shiftConfig", updated)
  }

  const addRow = () => {
    const newRow: ShiftConfigRow = {
      id: Date.now(),
      role: "",
      shift_label: "",
      start_hour: 7,
      end_hour: 19,
      hours_per_shift: 12,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    updateData("shiftConfig", updated)
  }

  // 🔄 Unified update helper with recalculation logic
  const updateRow = (index: number, changes: Partial<ShiftConfigRow>) => {
    const updated = rows.map((r, i) => {
      if (i !== index) return r
      const merged = { ...r, ...changes }
      // auto-calc if start or end changes
      if (
        changes.start_hour !== undefined ||
        changes.end_hour !== undefined
      ) {
        merged.hours_per_shift = calculateHours(
          merged.start_hour,
          merged.end_hour
        )
      }
      return merged
    })
    setRows(updated)
    updateData("shiftConfig", updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Shift Configuration
        </h3>
        <Button onClick={addRow}>+ Add Shift</Button>
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
                          updateRow(i, { role: e.target.value })
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

                    {/* Shift Label Dropdown w/ Auto-Fill */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`shift_label_${i}`}
                        label=""
                        value={row.shift_label}
                        onChange={(e) => {
                          const label = e.target.value
                          const template = shiftTemplates[label]
                          if (template) {
                            updateRow(i, {
                              shift_label: label,
                              start_hour: template.start,
                              end_hour: template.end,
                              hours_per_shift: template.hours,
                            })
                          } else {
                            updateRow(i, { shift_label: label })
                          }
                        }}
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Shift --</option>
                        <option value="Day">Day</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                      </Select>
                    </td>

                    {/* Start Hour */}
                    <td className="border px-2 py-1 text-right">
                    <Input
                      id={`start_${i}`}
                      label=""
                      type="number"
                      min={0}
                      max={23}
                      value={row.start_hour}
                      onChange={(e) =>
                        updateRow(i, { start_hour: Number(e.target.value) })
                      }
                      className="!m-0 !p-1 w-20 text-right"
                    />
                    </td>

                    {/* End Hour */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`end_${i}`}
                        label=""
                        type="number"
                        min={0}
                        max={23}
                        value={row.end_hour}
                        onChange={(e) =>
                          updateRow(i, { end_hour: Number(e.target.value) })
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Hours per Shift (auto-calculated) */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`hours_${i}`}
                        label=""
                        type="number"
                        min={1}
                        max={24}
                        value={row.hours_per_shift}
                        readOnly
                        className="!m-0 !p-1 w-20 text-right bg-gray-50"
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
