import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

type ShiftRow = {
  id?: number
  shift_label: string
  start_time: string
  end_time: string
  total_hours: number
  shift_type: "weekday_shift" | "weekend_shift" | ""
  days?: string[]
  roles?: string[]
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ShiftConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ShiftRow[]>([])
  const [saving, setSaving] = useState(false)

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]

  const availableRoles =
    Array.isArray(data?.positionStaffing) && data.positionStaffing.length > 0
      ? data.positionStaffing.map((r: any) => r.role)
      : ["RN", "LPN", "CNA", "Clerk"]

  // ✅ Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: ShiftRow[]) => {
      setSaving(true)
      updateData("shiftConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  useEffect(() => {
    const arr = Array.isArray(data?.shiftConfig)
      ? (data.shiftConfig as ShiftRow[])
      : []
    if (arr.length > 0) setRows(arr)
  }, [data?.shiftConfig])

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0
    const [sH, sM] = start.split(":").map(Number)
    const [eH, eM] = end.split(":").map(Number)
    const startDate = new Date(0, 0, 0, sH, sM)
    const endDate = new Date(0, 0, 0, eH, eM)
    let diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    if (diff < 0) diff += 24
    return parseFloat(diff.toFixed(2))
  }

  const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)

  const handleChange = (i: number, field: keyof ShiftRow, value: any) => {
    const updated = rows.map((r, idx) => {
      if (idx !== i) return r
      const newRow = { ...r, [field]: value }

      if (field === "start_time" || field === "end_time") {
        if (isValidTime(newRow.start_time) && isValidTime(newRow.end_time)) {
          newRow.total_hours = calculateHours(
            newRow.start_time,
            newRow.end_time
          )
        } else {
          newRow.total_hours = 0
        }
      }

      return newRow
    })
    setRows(updated)
    debouncedSave(updated)
  }

  const handleDaysChange = (i: number, selected: string[]) => {
    const updated = rows.map((r, idx) =>
      idx === i ? { ...r, days: selected } : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: ShiftRow = {
      id: Date.now(),
      shift_label: "",
      start_time: "",
      end_time: "",
      total_hours: 0,
      shift_type: "",
      days: [],
      roles: [],
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("shiftConfig", updated)
  }

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

  const getDaySummary = (days: string[] | undefined) => {
    if (!days || days.length === 0) return ""
    const weekdays = daysOfWeek.slice(0, 5)
    const weekends = daysOfWeek.slice(5)
    const hasAllWeekdays = weekdays.every((d) => days.includes(d))
    const hasAllWeekends = weekends.every((d) => days.includes(d))
    if (hasAllWeekdays && days.length === 5) return "Weekdays"
    if (hasAllWeekends && days.length === 2) return "Weekend"
    return days.join(", ")
  }

  return (
    <Card className="p-4 space-y-4">
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

      {rows.length === 0 ? (
        <p className="text-gray-500">No shift data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Shift Label</th>
                <th className="px-3 py-2 border">Start (24h)</th>
                <th className="px-3 py-2 border">End (24h)</th>
                <th className="px-3 py-2 border text-right">Total Hours</th>
                <th className="px-3 py-2 border text-center">Days</th>
                <th className="px-3 py-2 border text-center">Roles</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
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

                  <td className="border px-2 py-1">
                    <Input
                      id={`start_${i}`}
                      placeholder="07:00"
                      title="Enter start time in 24h format (e.g., 07:00, 18:30)"
                      value={row.start_time}
                      onChange={(e) =>
                        handleChange(i, "start_time", e.target.value)
                      }
                      className="!m-0 !p-1 w-24"
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <Input
                      id={`end_${i}`}
                      placeholder="19:00"
                      title="Enter end time in 24h format (e.g., 19:00, 06:30)"
                      value={row.end_time}
                      onChange={(e) =>
                        handleChange(i, "end_time", e.target.value)
                      }
                      className="!m-0 !p-1 w-24"
                    />
                  </td>

                  <td className="border px-2 py-1 text-right">
                    {Number(row.total_hours || 0).toFixed(2)}
                  </td>

                  {/* Days multiselect */}
                  <td className="border px-2 py-1 text-center">
                    <select
                      multiple
                      title="Select days for this shift"
                      aria-label="Select days for this shift"
                      className="w-40 text-xs border rounded-md p-1 bg-white focus:ring-1 focus:ring-green-500"
                      value={row.days || []}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (opt) => opt.value
                        )
                        handleDaysChange(i, selected)
                      }}
                    >
                      {daysOfWeek.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    {row.days && row.days.length > 0 && (
                      <div className="mt-1 text-gray-500 text-xs italic">
                        {getDaySummary(row.days)}
                      </div>
                    )}
                  </td>

                  {/* Roles multiselect */}
                  <td className="border px-2 py-1 text-center">
                    <select
                      multiple
                      title="Select roles for this shift"
                      aria-label="Select roles for this shift"
                      value={row.roles || []}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (opt) => opt.value
                        )
                        handleChange(i, "roles", selected)
                      }}
                      className="w-36 rounded-md border border-gray-300 bg-white text-xs p-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      {availableRoles.map((r) => (
                        <option
                          key={r}
                          value={r}
                          className="hover:bg-green-50 cursor-pointer"
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                    {(!row.roles || row.roles.length === 0) && (
                      <div className="text-gray-400 text-xs italic">Select…</div>
                    )}
                  </td>

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
