import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import InfoButton from "@/components/ui/InfoButton"
import debounce from "lodash.debounce"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

type ShiftRow = {
  id?: number
  shift_label: string
  start_time: string
  end_time: string
  total_hours: number
  weekend_group: "A" | "B" | "C" | "WC" | ""
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ShiftConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ShiftRow[]>([])
  const [saving, setSaving] = useState(false)
  const weekendGroups = ["A", "B", "C", "WC"]

  // ✅ Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: ShiftRow[]) => {
      setSaving(true)
      updateData("shiftConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // ✅ Load saved data or fallback
  useEffect(() => {
    const arr = Array.isArray(data?.shiftConfig)
      ? (data.shiftConfig as ShiftRow[])
      : []
    if (arr.length > 0) setRows(arr)
  }, [data?.shiftConfig])

  // ✅ Handle inline changes
  const handleChange = (i: number, field: keyof ShiftRow, value: any) => {
    const updated = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: value } : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Add new row
  const addRow = () => {
    const newRow: ShiftRow = {
      id: Date.now(),
      shift_label: "",
      start_time: "",
      end_time: "",
      total_hours: 0,
      weekend_group: "",
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Remove row
  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("shiftConfig", updated)
  }

  // ✅ Clear all
  const clearAll = () => {
    if (rows.length === 0) return
    Swal.fire({
      title: "Clear All Shifts?",
      text: "This will remove all shift entries.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear all",
    }).then((res) => {
      if (res.isConfirmed) {
        setRows([])
        updateData("shiftConfig", [])
        Swal.fire("Cleared!", "All shifts removed.", "success")
      }
    })
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Shift Configuration
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button
            variant="ghost"
            onClick={clearAll}
            className="border border-red-400 text-red-600 hover:bg-red-50"
          >
            🗑 Clear All
          </Button>
          <Button onClick={addRow} className="bg-green-600 hover:bg-green-700">
            + Add Shift
          </Button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-gray-500">No shift data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Shift Label</th>
                <th className="px-3 py-2 border">Start Time</th>
                <th className="px-3 py-2 border">End Time</th>
                <th className="px-3 py-2 border text-right">Total Hours</th>
                <th className="px-3 py-2 border">
                  <div className="flex items-center justify-center gap-1">
                    Weekend Group
                    <InfoButton text="Assign A, B, C, or WC to map this shift's weekend coverage." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  {/* Shift Label */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`label_${i}`}
                      value={row.shift_label}
                      onChange={(e) =>
                        handleChange(i, "shift_label", e.target.value)
                      }
                      placeholder="e.g., Day, Night"
                      className="!m-0 !p-1 w-32"
                    />
                  </td>

                  {/* Start Time */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`start_${i}`}
                      type="time"
                      value={row.start_time}
                      onChange={(e) =>
                        handleChange(i, "start_time", e.target.value)
                      }
                      className="!m-0 !p-1 w-28"
                    />
                  </td>

                  {/* End Time */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`end_${i}`}
                      type="time"
                      value={row.end_time}
                      onChange={(e) =>
                        handleChange(i, "end_time", e.target.value)
                      }
                      className="!m-0 !p-1 w-28"
                    />
                  </td>

                  {/* Total Hours */}
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`hours_${i}`}
                      type="number"
                      min={0}
                      value={row.total_hours}
                      onChange={(e) =>
                        handleChange(i, "total_hours", Number(e.target.value))
                      }
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  </td>

                  {/* Weekend Group */}
                  <td className="border px-2 py-1">
                    <Select
                      id={`weekend_${i}`}
                      label=""
                      value={row.weekend_group}
                      onChange={(e) =>
                        handleChange(i, "weekend_group", e.target.value as any)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="">-- Select --</option>
                      {weekendGroups.map((g) => (
                        <option key={g} value={g}>
                          Group {g}
                        </option>
                      ))}
                    </Select>
                  </td>

                  {/* Actions */}
                  <td className="border px-2 py-1 text-center">
                    <Button
                      onClick={() => removeRow(row.id)}
                      variant="ghost"
                      className="!px-2 !py-1 text-xs text-red-600"
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
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
