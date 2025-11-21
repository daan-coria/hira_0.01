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
  const shiftGroupSuggestions = ["Day", "Evening", "Night"]

  // -------------------------
  // DEBOUNCED SAVE
  // -------------------------
  const debouncedSave = useCallback(
    debounce((updated: ShiftRow[]) => {
      updateData("shiftConfig", updated)
      setSaving(false)
    }, 1200),
    []
  )

  // -------------------------
  // SHIFT NAME BUILDER
  // -------------------------
  const buildShiftName = (
    days: string[],
    start: string,
    end: string,
    breakMinutes: number | "N/A"
  ) => {
    if (!days || days.length === 0) return "";

    const weekdaySet = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const weekendSet = ["Saturday", "Sunday"];

    const hasWeekday = days.some(d => weekdaySet.includes(d));
    const hasWeekend = days.some(d => weekendSet.includes(d));

    // A. If exactly 1 day → show that day
    if (days.length === 1) {
      return buildFinalShiftLabel(days[0], start, end, breakMinutes);
    }

    // B. If all 5 weekdays → "Weekday"
    if (
      days.length === 5 &&
      weekdaySet.every(d => days.includes(d))
    ) {
      return buildFinalShiftLabel("Weekday", start, end, breakMinutes);
    }

    // C. If Saturday + Sunday → "Weekend"
    if (
      days.length === 2 &&
      weekendSet.every(d => days.includes(d))
    ) {
      return buildFinalShiftLabel("Weekend", start, end, breakMinutes);
    }

    // D. If multiple days but NOT all weekday or all weekend → list them
    if (days.length > 1 && (!hasWeekday || !hasWeekend)) {
      return buildFinalShiftLabel(days.join(", "), start, end, breakMinutes);
    }

    // E. Mixed weekday + weekend
    return buildFinalShiftLabel("Mixed", start, end, breakMinutes);
    };

  // -------------------------
  // FINAL LABEL BUILDER
  // -------------------------
  const buildFinalShiftLabel = (
    label: string,
    start: string,
    end: string,
    breakMinutes: number | "N/A"
  ) => {
    const formatTime = (t: string) => {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) return "";
      let [h] = t.split(":").map(Number);
      const suffix = h >= 12 ? "P" : "A";
      h = h % 12 === 0 ? 12 : h % 12;
      return `${h}${suffix}`;
    };

    const startLabel = formatTime(start);
    const endLabel = formatTime(end);

    let full = `${label} ${startLabel}-${endLabel}`;

    // BREAK LOGIC
    if (breakMinutes === 0) {
      full += " No Lunch";
    } else if (typeof breakMinutes === "number" && breakMinutes > 0) {
      if (breakMinutes < 60) {
        full += ` (Lunch: ${breakMinutes}m)`;
      } else {
        const hours = (breakMinutes / 60).toFixed(1).replace(".0", "");
        full += ` (Lunch: ${hours}h)`;
      }
    }

    return full.trim();
  };

  // -------------------------
  // LOAD EXISTING (normalize)
  // -------------------------
    useEffect(() => {
      const raw = Array.isArray(data?.shiftConfig) ? data.shiftConfig : [];

      if (raw.length === 3) {
        const starterRows: ShiftRow[] = Array.from({ length: 3 }).map(() => ({
          id: Date.now() + Math.random(),
          shift_group: "",
          shift_name: "N/A",
          start_time: "N/A",
          end_time: "N/A",
          break_minutes: "N/A",
          total_hours: "N/A",
          shift_type: "N/A",
          days: [],
          campuses: [],
        }));

        setRows(starterRows);
        updateData("shiftConfig", starterRows);
        return;
      }

      const normalized = raw.map((r: any) => ({
        id: typeof r.id === "number" ? r.id : Date.now(),
        shift_group: r.shift_group ?? "",
        shift_name: r.shift_name || "N/A",
        start_time: r.start_time || "N/A",
        end_time: r.end_time || "N/A",
        break_minutes:
          typeof r.break_minutes === "number" ? r.break_minutes : "N/A",
        total_hours:
          typeof r.total_hours === "number" ? r.total_hours : "N/A",
        shift_type: r.shift_type || "N/A",
        days: Array.isArray(r.days) ? r.days : [],
        campuses: Array.isArray(r.campuses) ? r.campuses : [],
      }));

      setRows(normalized);
    }, [data?.shiftConfig]);

  // -------------------------
  // TIME HELPERS
  // -------------------------
    const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)

    const calculateHours = (start: string, end: string, breakMinutes: number) => {
      if (!isValidTime(start) || !isValidTime(end)) return "N/A"

      const [sH, sM] = start.split(":").map(Number)
      const [eH, eM] = end.split(":").map(Number)

      const s = new Date(0, 0, 0, sH, sM)
      const e = new Date(0, 0, 0, eH, eM)

      let diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60)
      if (diff < 0) diff += 24

      diff -= breakMinutes / 60
      if (diff < 0) diff = 0

      return Number(diff.toFixed(2))
    }

    const recalcRow = (row: ShiftRow): ShiftRow => {
      if (
        row.start_time === "N/A" ||
        row.end_time === "N/A" ||
        row.break_minutes === "N/A"
      ) {
        return { ...row, total_hours: "N/A" }
      }

      return {
        ...row,
        total_hours: calculateHours(
          row.start_time,
          row.end_time,
          Number(row.break_minutes)
        ),
      }
    }

  // -------------------------
  // UPDATE FIELD (TS SAFE)
  // -------------------------

  const defaultShiftByGroup: Record<string, { start: string; end: string; break: number }> = {
    Day: { start: "07:00", end: "19:00", break: 0 },
    Evening: { start: "15:00", end: "23:00", break: 0 },
    Night: { start: "19:00", end: "07:00", break: 0 },
  };

  const updateRowField = (
    id: number,
    field: keyof ShiftRow,
    value: any,
    recalc: boolean = false
  ) => {
    setSaving(true);

    setRows(prev => {
      const updated = prev.map(row => {
        if (row.id !== id) return row;

        let newRow = { ...row };

        // -------------------------
        // SHIFT GROUP GATES THE ROW
        // -------------------------
        if (field === "shift_group") {
          newRow.shift_group = value;

          // If user clears the group → lock the row
          if (!value) {
            newRow.shift_name = "N/A";
            newRow.start_time = "N/A";
            newRow.end_time = "N/A";
            newRow.break_minutes = "N/A";
            newRow.total_hours = "N/A";
            newRow.shift_type = "N/A";
            newRow.days = [];
            newRow.campuses = [];
            return newRow;
          }

          // Apply defaults for Day / Evening / Night
          const preset = defaultShiftByGroup[value];
          if (preset) {
            newRow.start_time = preset.start;
            newRow.end_time = preset.end;
            newRow.break_minutes = preset.break;
          }

          // If days already selected, build name immediately
          if (newRow.days.length > 0) {
            newRow.shift_name = buildShiftName(
              newRow.days,
              newRow.start_time,
              newRow.end_time,
              newRow.break_minutes
            );
          } else {
            // Otherwise, name waits until days are chosen
            newRow.shift_name = "";
          }

          return newRow;
        }

        // -------------------------
        // UNLOCK FIELDS IF PREVIOUSLY "N/A"
        // -------------------------
        if (newRow.shift_name === "N/A") newRow.shift_name = "";
        if (newRow.start_time === "N/A") newRow.start_time = "";
        if (newRow.end_time === "N/A") newRow.end_time = "";
        if (newRow.break_minutes === "N/A") newRow.break_minutes = 0;
        if (newRow.shift_type === "N/A") newRow.shift_type = "";

        // -------------------------
        // TS SAFE FIELD UPDATES
        // -------------------------
        switch (field) {
          case "shift_name":
          case "start_time":
          case "end_time":
          case "shift_type":
            newRow[field] = value;
            break;

          case "break_minutes":
            newRow.break_minutes = value === "" ? 0 : Number(value);
            break;

          case "days":
            newRow.days = value;
            break;

          case "campuses":
            newRow.campuses = value;
            break;

          case "total_hours":
            newRow.total_hours = value;
            break;

          default:
            break;
        }

        // -------------------------
        // AUTO-BUILD SHIFT NAME
        // -------------------------
        if (
          field === "start_time" ||
          field === "end_time" ||
          field === "break_minutes" ||
          field === "days"
        ) {
          const hasStart = newRow.start_time && newRow.start_time !== "N/A";
          const hasEnd = newRow.end_time && newRow.end_time !== "N/A";
          const hasBreak = typeof newRow.break_minutes === "number";
          const hasDays = newRow.days.length > 0;

          if (hasStart && hasEnd && hasBreak && hasDays) {
            newRow.shift_name = buildShiftName(
              newRow.days,
              newRow.start_time,
              newRow.end_time,
              newRow.break_minutes
            );
          } else {
            newRow.shift_name = "";
          }
        }

        // -------------------------
        // RECALC HOURS
        // -------------------------
        return recalc ? recalcRow(newRow) : newRow;
      });

      debouncedSave(updated);
      return updated;
    });
  };

  const updateRowDays = (id: number, days: string[]) => {
    updateRowField(id, "days", days)
  }

  const updateRowCampuses = (id: number, c: string[]) => {
    updateRowField(id, "campuses", c)
  }

  // -------------------------
  // ADD / REMOVE
  // -------------------------
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
    const updated = rows.filter(r => r.id !== id)
    setRows(updated)
    updateData("shiftConfig", updated)
  }

  const clearAll = () => {
    Swal.fire({
      title: "Clear all shifts?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, clear all",
    }).then(res => {
      if (res.isConfirmed) {
        setRows([])
        updateData("shiftConfig", [])
      }
    })
  }

  // -------------------------
  // DRAG & DROP (FULLY FIXED)
  // -------------------------
  const handleDragStart = (id: number) => {
    setDragId(id)
  }

  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) return

    setRows(prev => {
      const currentIndex = prev.findIndex(r => r.id === dragId)
      const targetIndex = prev.findIndex(r => r.id === targetId)

      if (currentIndex === -1 || targetIndex === -1) return prev

      const updated = [...prev]
      const [moved] = updated.splice(currentIndex, 1)
      updated.splice(targetIndex, 0, moved)

      debouncedSave(updated)
      return updated
    })

    setDragId(null)
  }

  // -------------------------
  // FILTER + SORT
  // -------------------------
  let displayRows = rows

  if (filterGroup) {
    displayRows = displayRows.filter(r => r.shift_group === filterGroup)
  }

  if (sortMode !== "none") {
    displayRows = [...displayRows].sort((a, b) => {
      switch (sortMode) {
        case "start":
          return a.start_time.localeCompare(b.start_time)
        case "end":
          return a.end_time.localeCompare(b.end_time)
        case "hours":
          if (a.total_hours === "N/A") return 1
          if (b.total_hours === "N/A") return -1
          return (a.total_hours as number) - (b.total_hours as number)
        case "group":
          return a.shift_group.localeCompare(b.shift_group)
        default:
          return 0
      }
    })
  }

  const isLocked = (row: ShiftRow) => !row.shift_group

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shift Configuration</h3>
        <div className="flex items-center gap-3 text-sm">
          {saving && <span className="text-gray-500">Saving...</span>}
          <Button
            variant="ghost"
            className="border border-red-500 text-red-600"
            onClick={clearAll}
          >
            Clear All
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={addRow}>
            + Add Shift
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex gap-4 text-sm">
        <div>
          <span className="mr-2">Filter Group:</span>
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            {Array.from(new Set(rows.map(r => r.shift_group).filter(Boolean))).map(
              g => (
                <option key={g}>{g}</option>
              )
            )}
          </select>
        </div>

        <div>
          <span className="mr-2">Sort:</span>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="border rounded px-2 py-1"
          >
            <option value="none">None (drag reorder)</option>
            <option value="group">Group A–Z</option>
            <option value="start">Start Time</option>
            <option value="end">End Time</option>
            <option value="hours">Total Hours</option>
          </select>
        </div>
      </div>

      {/* SHIFT GROUP AUTOCOMPLETE */}
      <datalist id="shift-group-suggestions">
        {shiftGroupSuggestions.map(g => (
          <option key={g} value={g} />
        ))}
      </datalist>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 w-6">⇕</th>
              <th className="border px-2 py-1">Group</th>
              <th className="border px-2 py-1 w-[260px]">Name</th>
              <th className="border px-2 py-1">Start</th>
              <th className="border px-2 py-1">End</th>
              <th className="border px-2 py-1 text-right">Break</th>
              <th className="border px-2 py-1 text-right">Hours</th>
              <th className="border px-2 py-1">Days</th>
              <th className="border px-2 py-1">Campuses</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>

          <tbody>
            {displayRows.map(row => (
              <tr
                key={row.id}
                draggable={sortMode === "none"}
                onDragStart={() => handleDragStart(row.id)}
                onDragOver={e => sortMode === "none" && e.preventDefault()}
                onDrop={() => sortMode === "none" && handleDrop(row.id)}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                style={{
                  cursor: sortMode === "none" ? "grab" : "default",
                }}
              >
                <td className="border px-2 text-center">☰</td>

                {/* GROUP */}
                <td className="border px-2">
                  <Input
                    id=""
                    value={row.shift_group}
                    list="shift-group-suggestions"
                    onChange={e =>
                      updateRowField(row.id, "shift_group", e.target.value)
                    }
                    className="!m-0 !p-1"
                  />
                </td>

                {/* NAME */}
                <td className="border px-2 align-top">
                  {isLocked(row) ? (
                    "N/A"
                  ) : (
                    <textarea
                      value={row.shift_name}
                      onChange={e =>
                        updateRowField(row.id, "shift_name", e.target.value)
                      }
                      className="
                        w-[260px]
                        min-h-[38px]
                        max-h-[80px]
                        px-2 py-1
                        border rounded-md
                        bg-white dark:bg-gray-900
                        border-gray-300 dark:border-gray-700
                        text-gray-800 dark:text-gray-100
                        focus:ring-2 focus:ring-green-500 focus:border-green-500
                        outline-none transition
                        whitespace-normal
                        break-words
                        resize-none
                      "
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.3",
                      }}
                    />
                  )}
                </td>

                {/* START */}
                <td className="border px-2">
                  {isLocked(row) ? (
                    "N/A"
                  ) : (
                    <Input
                      id=""
                      type="time"
                      step="60"     // 1-minute increments, or change to 900 for 15-minute
                      value={row.start_time}
                      onChange={e =>
                        updateRowField(
                          row.id,
                          "start_time",
                          e.target.value,
                          true
                        )
                      }
                      className="!m-0 !p-1 w-28"
                      style={{ fontSize: "13px" }}
                    />
                  )}
                </td>

                {/* END */}
                <td className="border px-2">
                  {isLocked(row) ? (
                    "N/A"
                  ) : (
                    <Input
                      id=""
                      type="time"
                      step="60"
                      value={row.end_time}
                      onChange={e =>
                        updateRowField(
                          row.id,
                          "end_time",
                          e.target.value,
                          true
                        )
                      }
                      className="!m-0 !p-1 w-28"
                      style={{ fontSize: "13px" }}
                    />
                  )}
                </td>

                {/* BREAK */}
                <td className="border px-2 text-right">
                  {isLocked(row) ? (
                    "N/A"
                  ) : (
                    <Input
                      id=""
                      type="number"
                      value={row.break_minutes}
                      onChange={e =>
                        updateRowField(
                          row.id,
                          "break_minutes",
                          e.target.value,
                          true
                        )
                      }
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  )}
                </td>

                {/* HOURS */}
                <td className="border px-2 text-right">
                  {row.total_hours === "N/A"
                    ? "N/A"
                    : Number(row.total_hours).toFixed(2)}
                </td>

                {/* DAYS */}
                <td className="border px-2">
                  {isLocked(row) ? (
                    "N/A"
                  ) : (
                    <div className="flex flex-col gap-1 text-xs max-h-28 overflow-auto">
                      {daysOfWeek.map(day => {
                        const checked = row.days.includes(day)
                        return (
                          <label key={day} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                const updated = e.target.checked
                                  ? [...row.days, day]
                                  : row.days.filter(d => d !== day)
                                updateRowDays(row.id, updated)
                              }}
                            />
                            {day}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </td>

                {/* CAMPUSES */}
                <td className="border px-2">
                  {isLocked(row) ? (
                    "N/A"
                  ) : (
                    <div className="flex flex-col gap-1 text-xs max-h-28 overflow-auto">
                      {campusOptions.map(campus => {
                        const checked = row.campuses.includes(campus)
                        return (
                          <label key={campus} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                const updated = e.target.checked
                                  ? [...row.campuses, campus]
                                  : row.campuses.filter(c => c !== campus)
                                updateRowCampuses(row.id, updated)
                              }}
                            />
                            {campus}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="border px-2 text-center">
                  <Button
                    variant="ghost"
                    className="text-red-600 !px-2 !py-1"
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
    </Card>
  )
}
