import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

type ShiftType = "weekday_shift" | "weekend_shift" | ""

type ShiftRow = {
  id: number
  shift_group: string
  shift_name: string
  start_time: string
  end_time: string
  break_minutes: number
  total_hours: number
  shift_type: ShiftType
  days: string[]
  campuses: string[]
  roles: string[]
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

  // Debounced autosave to context
  const debouncedSave = useCallback(
    debounce((updated: ShiftRow[]) => {
      updateData("shiftConfig", updated)
    }, 1500),
    []
  )


  // Normalize any existing data from context (old structure → new structure)
  useEffect(() => {
    const arrRaw = Array.isArray(data?.shiftConfig) ? (data.shiftConfig as any[]) : []
    if (arrRaw.length === 0) return

    const normalized: ShiftRow[] = arrRaw.map((r, idx) => {
      const id =
        typeof r.id === "number"
          ? r.id
          : Date.now() + idx // ensure an ID
      const shift_group = r.shift_group ?? ""
      const shift_name = r.shift_name ?? r.shift_label ?? ""
      const start_time = r.start_time ?? ""
      const end_time = r.end_time ?? ""
      const break_minutes =
        typeof r.break_minutes === "number" ? r.break_minutes : 0
      const total_hours =
        typeof r.total_hours === "number" ? r.total_hours : 0
      const shift_type: ShiftType = r.shift_type ?? ""
      const days = Array.isArray(r.days) ? r.days : []
      const roles = Array.isArray(r.roles) ? r.roles : []
      const campuses = Array.isArray(r.campuses) ? r.campuses : []

      return {
        id,
        shift_group,
        shift_name,
        start_time,
        end_time,
        break_minutes,
        total_hours,
        shift_type,
        days,
        roles,
        campuses,
      }
    })

    setRows(normalized)
    // ❌ DO NOT call updateData here or it will loop
  }, [data?.shiftConfig])

  // ---------- Helpers ----------

  const isValidTime = (value: string) =>
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)

  const calculateHours = (
    start: string,
    end: string,
    breakMinutes: number = 0
  ) => {
    if (!isValidTime(start) || !isValidTime(end)) return 0

    const [sH, sM] = start.split(":").map(Number)
    const [eH, eM] = end.split(":").map(Number)

    const startDate = new Date(0, 0, 0, sH, sM)
    const endDate = new Date(0, 0, 0, eH, eM)

    let diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    if (diff < 0) diff += 24 // overnight shift

    diff -= (breakMinutes || 0) / 60
    if (diff < 0) diff = 0

    return parseFloat(diff.toFixed(2))
  }

  const recalcRowHours = (row: ShiftRow): ShiftRow => {
    return {
      ...row,
      total_hours: calculateHours(row.start_time, row.end_time, row.break_minutes),
    }
  }

  const updateRowField = (
    id: number,
    field: keyof ShiftRow,
    value: any,
    recalcHours: boolean = false
  ) => {
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.id !== id) return row

        const newRow = {
          ...row,
          [field]: field === "break_minutes" ? Number(value) || 0 : value,
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
      shift_name: "",
      start_time: "",
      end_time: "",
      break_minutes: 0,
      total_hours: 0,
      shift_type: "",
      days: [],
      roles: [],
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

  const handleDragStart = (id: number) => {
    setDragId(id)
  }

  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) return

    const currentIndex = rows.findIndex((r) => r.id === dragId)
    const targetIndex = rows.findIndex((r) => r.id === targetId)
    if (currentIndex === -1 || targetIndex === -1) return

    const updated = [...rows]
    const [moved] = updated.splice(currentIndex, 1)
    updated.splice(targetIndex, 0, moved)

    setRows(updated)
    debouncedSave(updated)
    setDragId(null)
  }

  // Build list of shift groups for filter
  const shiftGroups = Array.from(
    new Set(rows.map((r) => r.shift_group).filter(Boolean))
  )

  // Apply filter + sort for display
  let displayRows = rows
  if (filterGroup) {
    displayRows = displayRows.filter((r) => r.shift_group === filterGroup)
  }

  if (sortMode !== "none") {
    displayRows = [...displayRows].sort((a, b) => {
      switch (sortMode) {
        case "start":
          return a.start_time.localeCompare(b.start_time)
        case "end":
          return a.end_time.localeCompare(b.end_time)
        case "hours":
          return a.total_hours - b.total_hours
        case "group":
          return a.shift_group.localeCompare(b.shift_group)
        default:
          return 0
      }
    })
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Shift Configuration
        </h3>
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
            <Button
              onClick={addRow}
              className="bg-green-600 hover:bg-green-700"
            >
              + Add Shift
            </Button>
          </div>
        </div>
      </div>

      {/* Filter + Sort bar */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 text-sm mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Filter by Shift Group:</span>
          <select
            aria-label="Filter by Shift Group"
            className="border rounded-lg px-2 py-1 text-sm"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="">All</option>
            {shiftGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Sort:</span>
          <select
            aria-label="Sort Shifts"
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

        <div className="ml-auto text-xs text-gray-500">
          Showing {displayRows.length} of {rows.length} shifts
        </div>
      </div>

      {/* suggestions for shift groups */}
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
                <th className="px-3 py-2 border">Start (24h)</th>
                <th className="px-3 py-2 border">End (24h)</th>
                <th className="px-3 py-2 border text-right">
                  Non-Shift Break (min)
                </th>
                <th className="px-3 py-2 border text-right">Total Hours</th>
                <th className="px-3 py-2 border text-center">Days</th>
                <th className="px-3 py-2 border text-center">Campus</th>
                <th className="px-3 py-2 border text-center">Roles</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row) => (
                <tr
                  key={row.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 h-[180px]"
                  draggable={sortMode === "none"}
                  onDragStart={() => handleDragStart(row.id)}
                  onDragOver={(e) => sortMode === "none" && e.preventDefault()}
                  onDrop={() => sortMode === "none" && handleDrop(row.id)}
                >

                  {/* drag handle */}
                  <td
                    className={`border px-2 py-1 text-center select-none ${
                      sortMode === "none"
                        ? "cursor-grab text-gray-500"
                        : "cursor-default text-gray-300"
                    }`}
                  >
                    ☰
                  </td>

                  {/* Shift Group */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`shift_group_${row.id}`}
                      value={row.shift_group}
                      onChange={(e) =>
                        updateRowField(row.id, "shift_group", e.target.value)
                      }
                      list="shift-group-suggestions"
                      placeholder="Day / Night / Weekend"
                      className="!m-0 !p-1 w-32"
                    />
                  </td>

                  {/* Shift Name */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`shift_name_${row.id}`}
                      value={row.shift_name}
                      onChange={(e) =>
                        updateRowField(row.id, "shift_name", e.target.value)
                      }
                      placeholder="e.g., Weekday 7A–7P"
                      className="!m-0 !p-1 w-40"
                    />
                  </td>

                  {/* Start */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`start_${row.id}`}
                      placeholder="07:00"
                      title="Enter start time in 24h format (e.g., 07:00, 18:30)"
                      value={row.start_time}
                      onChange={(e) =>
                        updateRowField(
                          row.id,
                          "start_time",
                          e.target.value,
                          true
                        )
                      }
                      className="!m-0 !p-1 w-20"
                    />
                  </td>

                  {/* End */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`end_${row.id}`}
                      placeholder="19:00"
                      title="Enter end time in 24h format (e.g., 19:00, 06:30)"
                      value={row.end_time}
                      onChange={(e) =>
                        updateRowField(
                          row.id,
                          "end_time",
                          e.target.value,
                          true
                        )
                      }
                      className="!m-0 !p-1 w-20"
                    />
                  </td>

                  {/* Break minutes */}
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`break_${row.id}`}
                      type="number"
                      min={0}
                      step={5}
                      value={row.break_minutes.toString()}
                      onChange={(e) =>
                        updateRowField(
                          row.id,
                          "break_minutes",
                          e.target.value,
                          true
                        )
                      }
                      className="!m-0 !p-1 w-20 text-right"
                      placeholder="0"
                    />
                  </td>

                  {/* Total Hours */}
                  <td className="border px-2 py-1 text-right">
                    {Number(row.total_hours || 0).toFixed(2)}
                  </td>

                  {/* Days checkboxes */}
                  <td className="border px-2 py-1 text-left align-top">
                    <div className="flex flex-col gap-1 min-h-[120px] overflow-y-auto">
                      {daysOfWeek.map((day) => {
                        const checked = row.days.includes(day)
                        return (
                          <label
                            key={day}
                            className="flex items-center gap-1 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const selected = e.target.checked
                                  ? [...row.days, day]
                                  : row.days.filter((d) => d !== day)
                                updateRowDays(row.id, selected)
                              }}
                              className="rounded text-green-600 focus:ring-green-500"
                            />
                            {day}
                          </label>
                        )
                      })}
                    </div>
                    {row.days.length > 0 && (
                      <div className="mt-1 text-gray-500 text-xs italic">
                        {getDaySummary(row.days)}
                      </div>
                    )}
                  </td>

                  {/* Campus checkboxes */}
                  <td className="border px-2 py-1 text-left align-top">
                    <div className="flex flex-col gap-1 min-h-[120px] overflow-y-auto">
                      {campusOptions.map((campus) => {
                        const checked = row.campuses.includes(campus)
                        return (
                          <label
                            key={campus}
                            className="flex items-center gap-1 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const selected = e.target.checked
                                  ? [...row.campuses, campus]
                                  : row.campuses.filter((c) => c !== campus)
                                updateRowCampuses(row.id, selected)
                              }}
                              className="rounded text-green-600 focus:ring-green-500"
                            />
                            {campus}
                          </label>
                        )
                      })}
                    </div>
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

      {/* Requirements / helper text */}
      <ul className="mt-4 text-xs text-gray-600 list-disc pl-5 space-y-1">
        <li>
          Define the shift types that should be available to be used and what
          campuses they apply to for later use in defining staffing needs for
          each cost center.
        </li>
        <li>
          With sort set to <strong>None</strong>, you can drag and drop rows to
          arrange shifts on screen.
        </li>
        <li>
          Use the filter and sort controls above the grid to change which shifts
          are in view.
        </li>
      </ul>

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
