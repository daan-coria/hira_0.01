import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

type ShiftType = "weekday_shift" | "weekend_shift" | "N/A" | ""

type ShiftRow = {
  id: number
  shift_group: string
  shift_name: string
  start_time: string
  end_time: string
  break_minutes: number | "N/A"
  total_hours: number | "N/A"
  shift_type: ShiftType
  days: string[]
  campuses: string[]
}

type SortMode = "none" | "start" | "end" | "hours" | "group"

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ShiftConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ShiftRow[]>([])
  const [saving, setSaving] = useState(false)
  const [filterGroup, setFilterGroup] = useState<string>("")
  const [sortMode, setSortMode] = useState<SortMode>("none")
  const [dragId, setDragId] = useState<number | null>(null)

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]

  const campusOptions = ["Lansing", "Bay", "Flint"]

  const shiftGroupSuggestions = ["Day", "Evening", "Night", "Weekend", "Weekday"]

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce((updated: ShiftRow[]) => {
      updateData("shiftConfig", updated)
    }, 1500),
    []
  )

  // Normalize existing rows
  useEffect(() => {
    const arrRaw = Array.isArray(data?.shiftConfig) ? (data.shiftConfig as any[]) : []
    if (arrRaw.length === 0) return

    const normalized: ShiftRow[] = arrRaw.map((r, idx) => {
      const id = typeof r.id === "number" ? r.id : Date.now() + idx

      const shift_group = r.shift_group ?? ""

      const blankOrNA = (v: any) => (v === "" || v == null ? "N/A" : v)

      return {
        id,
        shift_group,
        shift_name: blankOrNA(r.shift_name),
        start_time: blankOrNA(r.start_time),
        end_time: blankOrNA(r.end_time),
        break_minutes: typeof r.break_minutes === "number" ? r.break_minutes : "N/A",
        total_hours: typeof r.total_hours === "number" ? r.total_hours : "N/A",
        shift_type: r.shift_type ?? "N/A",
        days: Array.isArray(r.days) ? r.days : [],
        campuses: Array.isArray(r.campuses) ? r.campuses : [],
      }
    })

    setRows(normalized)
  }, [data?.shiftConfig])

  // Validate time format
  const isValidTime = (value: string) =>
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)

  const calculateHours = (start: string, end: string, breakMinutes: number) => {
    if (!isValidTime(start) || !isValidTime(end)) return "N/A"

    const [sH, sM] = start.split(":").map(Number)
    const [eH, eM] = end.split(":").map(Number)

    const startDate = new Date(0, 0, 0, sH, sM)
    const endDate = new Date(0, 0, 0, eH, eM)

    let diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    if (diff < 0) diff += 24

    diff -= breakMinutes / 60
    if (diff < 0) diff = 0

    return parseFloat(diff.toFixed(2))
  }

  // Auto recalc
  const recalcRowHours = (row: ShiftRow): ShiftRow => {
    if (
      row.start_time === "N/A" ||
      row.end_time === "N/A" ||
      row.break_minutes === "N/A"
    ) {
      return { ...row, total_hours: "N/A" }
    }

    const hours = calculateHours(row.start_time, row.end_time, Number(row.break_minutes))
    return { ...row, total_hours: hours }
  }

  // UPDATE FIELD (with "N/A" gating logic)
  const updateRowField = (
    id: number,
    field: keyof ShiftRow,
    value: any,
    recalcHours: boolean = false
  ) => {
    setRows((prev) => {
      const updated = prev.map((row) => {
        if (row.id !== id) return row

        let newRow = { ...row }

        if (field === "shift_group") {
          newRow.shift_group = value

          // When cleared → lock everything to N/A
          if (!value) {
            newRow.shift_name = "N/A"
            newRow.start_time = "N/A"
            newRow.end_time = "N/A"
            newRow.break_minutes = "N/A"
            newRow.total_hours = "N/A"
            newRow.shift_type = "N/A"
            newRow.days = []
            newRow.campuses = []
            return newRow
          }

          // When set → unlock fields by clearing N/A to ""
          if (newRow.shift_name === "N/A") newRow.shift_name = ""
          if (newRow.start_time === "N/A") newRow.start_time = ""
          if (newRow.end_time === "N/A") newRow.end_time = ""
          if (newRow.break_minutes === "N/A") newRow.break_minutes = 0
          if (newRow.shift_type === "N/A") newRow.shift_type = ""
        } else {
          // Normal field update
          (newRow as any)[field] =
            field === "break_minutes" ? (value === "" ? 0 : Number(value)) : value
        }

        return recalcHours ||
          field === "start_time" ||
          field === "end_time" ||
          field === "break_minutes"
          ? recalcRowHours(newRow)
          : newRow
      })

      debouncedSave(updated)
      return updated
    })
  }

  const updateRowDays = (id: number, selected: string[]) => {
    const updated = rows.map((row) =>
      row.id === id ? { ...row, days: selected } : row
    )
    setRows(updated)
    debouncedSave(updated)
  }

  const updateRowCampuses = (id: number, selected: string[]) => {
    const updated = rows.map((row) =>
      row.id === id ? { ...row, campuses: selected } : row
    )
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: ShiftRow = {
      id: Date.now(),
      shift_group: "",
      shift_name: "N/A",
      start_time: "N/A",
      end_time: "N/A",
      break_minutes: "N/A",
      total_hours: "N/A",
      shift_type: "N/A",
      days: [],
      campuses: [],
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  const removeRow = (id: number) => {
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
      }
    })
  }

  // UI LIST of groups
  const shiftGroups = Array.from(
    new Set(rows.map((r) => r.shift_group).filter(Boolean))
  )

  // Display filtering and sorting
  let displayRows = rows
  if (filterGroup) displayRows = displayRows.filter((r) => r.shift_group === filterGroup)

  if (sortMode !== "none") {
    displayRows = [...displayRows].sort((a, b) => {
      switch (sortMode) {
        case "start":
          return a.start_time.localeCompare(b.start_time)
        case "end":
          return a.end_time.localeCompare(b.end_time)
        case "hours":
          return (a.total_hours as number) - (b.total_hours as number)
        case "group":
          return a.shift_group.localeCompare(b.shift_group)
        default:
          return 0
      }
    })
  }

  const isDisabled = (row: ShiftRow) => !row.shift_group

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Shift Configuration</h3>
        <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
          {saving && <span>Saving…</span>}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={clearAll}
              className="border border-red-400 text-red-600 hover:bg-red-50"
            >
              🗑 Clear All
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={addRow}>
              + Add Shift
            </Button>
          </div>
        </div>
      </div>

      {/* FILTER + SORT BAR */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 text-sm mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Filter by Shift Group:</span>
          <select
            className="border rounded-lg px-2 py-1 text-sm"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="">All</option>
            {shiftGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Sort:</span>
          <select
            className="border rounded-lg px-2 py-1 text-sm"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="none">None (drag to reorder)</option>
            <option value="group">Shift Group A–Z</option>
            <option value="start">Start Time</option>
            <option value="end">End Time</option>
            <option value="hours">Total Hours</option>
          </select>
        </div>
      </div>

      {/* SHIFT GROUP SUGGESTIONS */}
      <datalist id="shift-group-suggestions">
        {shiftGroupSuggestions.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>

      {displayRows.length === 0 ? (
        <p className="text-gray-500">No shift data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border w-6 text-center">⇕</th>
                <th className="px-3 py-2 border">Shift Group</th>
                <th className="px-3 py-2 border">Shift Name</th>
                <th className="px-3 py-2 border">Start</th>
                <th className="px-3 py-2 border">End</th>
                <th className="px-3 py-2 border text-right">Break (min)</th>
                <th className="px-3 py-2 border text-right">Total Hours</th>
                <th className="px-3 py-2 border text-center">Days</th>
                <th className="px-3 py-2 border text-center">Campuses</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row) => (
                <tr
                  key={row.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >

                  {/* drag handle */}
                  <td className="border px-2 py-1 text-center cursor-grab">☰</td>

                  {/* Shift group */}
                  <td className="border px-2 py-1">
                    <Input
                      value={row.shift_group}
                      id={`shift-group-${row.id}`}    
                      onChange={(e) =>
                        updateRowField(row.id, "shift_group", e.target.value)
                      }
                      placeholder="Day / Night / Weekend"
                      list="shift-group-suggestions"
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* Shift name */}
                  <td className="border px-2 py-1">
                    {isDisabled(row) ? (
                      "N/A"
                    ) : (
                      <Input
                        id={`shift-name-${row.id}`}
                        value={row.shift_name}
                        onChange={(e) =>
                          updateRowField(row.id, "shift_name", e.target.value)
                        }
                        className="!m-0 !p-1"
                      />
                    )}
                  </td>

                  {/* Start time */}
                  <td className="border px-2 py-1">
                    {isDisabled(row) ? (
                      "N/A"
                    ) : (
                      <Input
                        id={`start-time-${row.id}`}
                        value={row.start_time}
                        onChange={(e) =>
                          updateRowField(row.id, "start_time", e.target.value, true)
                        }
                        placeholder="07:00"
                        className="!m-0 !p-1 w-20"
                      />
                    )}
                  </td>

                  {/* End time */}
                  <td className="border px-2 py-1">
                    {isDisabled(row) ? (
                      "N/A"
                    ) : (
                      <Input
                        id={`end-time-${row.id}`}
                        value={row.end_time}
                        onChange={(e) =>
                          updateRowField(row.id, "end_time", e.target.value, true)
                        }
                        placeholder="19:00"
                        className="!m-0 !p-1 w-20"
                      />
                    )}
                  </td>

                  {/* Break */}
                  <td className="border px-2 py-1 text-right">
                    {isDisabled(row) ? (
                      "N/A"
                    ) : (
                      <Input
                        type="number"
                        value={row.break_minutes}
                        id={`break-minutes-${row.id}`}
                        onChange={(e) =>
                          updateRowField(row.id, "break_minutes", e.target.value, true)
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    )}
                  </td>

                  {/* Total hours */}
                  <td className="border px-2 py-1 text-right">
                    {row.total_hours === "N/A"
                      ? "N/A"
                      : Number(row.total_hours).toFixed(2)}
                  </td>

                  {/* Days */}
                  <td className="border px-2 py-1">
                    {isDisabled(row) ? (
                      "N/A"
                    ) : (
                      <div className="flex flex-col gap-1 h-[120px] overflow-y-auto text-xs">
                        {daysOfWeek.map((day) => {
                          const checked = row.days.includes(day)
                          return (
                            <label key={day} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const selected = e.target.checked
                                    ? [...row.days, day]
                                    : row.days.filter((d) => d !== day)
                                  updateRowDays(row.id, selected)
                                }}
                              />
                              {day}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </td>

                  {/* campuses */}
                  <td className="border px-2 py-1">
                    {isDisabled(row) ? (
                      "N/A"
                    ) : (
                      <div className="flex flex-col gap-1 h-[120px] overflow-y-auto text-xs">
                        {campusOptions.map((campus) => {
                          const checked = row.campuses.includes(campus)
                          return (
                            <label key={campus} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const selected = e.target.checked
                                    ? [...row.campuses, campus]
                                    : row.campuses.filter((c) => c !== campus)
                                  updateRowCampuses(row.id, selected)
                                }}
                              />
                              {campus}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="border px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs text-red-600"
                      onClick={() => removeRow(row.id)}
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

      {/* helper text */}
      <ul className="mt-4 text-xs text-gray-600 list-disc pl-5 space-y-1">
        <li>Shifts remain disabled (N/A) until a shift group is selected.</li>
        <li>With Sort = None, you can drag rows to reorder them.</li>
        <li>Use filter and sort controls above to narrow results.</li>
      </ul>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onPrev}>← Previous</Button>
        <Button variant="primary" onClick={onNext}>Next →</Button>
      </div>
    </Card>
  )
}
