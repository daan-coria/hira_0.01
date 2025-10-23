import { useEffect, useState, useCallback, useMemo } from "react"
import Select from "react-select"
import type { StylesConfig, GroupBase } from "react-select"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"

type DateRange = { start: string; end: string }

type AvailabilityRow = {
  id?: number
  staff_name: string
  type: "PTO" | "LOA" | "Orientation" | ""
  range: DateRange
  days: number
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function AvailabilityConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<AvailabilityRow[]>([])
  const [saving, setSaving] = useState(false)

  // --- Debounced autosave ---
  const debouncedSave = useCallback(
    debounce((updated: AvailabilityRow[]) => {
      setSaving(true)
      updateData("availabilityConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 600),
    []
  )

  // --- Normalize old data for backward compatibility ---
  const normalizeRows = (input: any[]): AvailabilityRow[] => {
    return (input || []).map((r: any) => {
      if (r.range) return r // already new structure

      const typeGuess =
        r.pto_range ? "PTO" :
        r.loa_range ? "LOA" :
        r.orientation_range ? "Orientation" : ""

      const rangeGuess =
        r.pto_range || r.loa_range || r.orientation_range || { start: "", end: "" }

      const daysGuess =
        r.pto_days || r.loa_days || r.orientation_days || 0

      return {
        id: r.id || Date.now(),
        staff_name: r.staff_name || "",
        type: typeGuess,
        range: rangeGuess,
        days: daysGuess,
      }
    })
  }

  // --- Build dropdown options from Step 2 (resourceInput) ---
  const staffOptions = useMemo(() => {
    if (!Array.isArray(data?.resourceInput)) return []
    return data.resourceInput.map((r: any) => ({
      value: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      label: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
    }))
  }, [data?.resourceInput])

  // --- Absence type options ---
  const typeOptions = [
    { value: "PTO", label: "PTO" },
    { value: "LOA", label: "LOA" },
    { value: "Orientation", label: "Orientation" },
  ]

  // --- Load & normalize data ---
  useEffect(() => {
    if (Array.isArray(data?.availabilityConfig)) {
      const normalized = normalizeRows(data.availabilityConfig)
      setRows(normalized)
      updateData("availabilityConfig", normalized)
    }
  }, [data?.availabilityConfig])

  // --- Helper to calculate days ---
  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 ? diff + 1 : 0
  }

  // --- Handle date changes ---
  const handleRangeChange = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updated = rows.map((r, i) => {
      if (i !== index) return r
      const newRange = { ...r.range, [field]: value }
      const newDays = calcDays(newRange.start, newRange.end)
      return { ...r, range: newRange, days: newDays }
    })
    setRows(updated)
    debouncedSave(updated)
  }

  // --- Add new availability entry ---
  const handleAdd = () => {
    const newRow: AvailabilityRow = {
      id: Date.now(),
      staff_name: "",
      type: "",
      range: { start: "", end: "" },
      days: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    updateData("availabilityConfig", updated)
  }

  // --- Custom styles for react-select ---
  const customSelectStyles: StylesConfig<any, false, GroupBase<any>> = {
    control: (base) => ({
      ...base,
      minHeight: "28px",
      fontSize: "0.875rem",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: "2px",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "28px",
    }),
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Resource Availability
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={handleAdd}>+ Add Entry</Button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-gray-500">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Staff Name</th>
                <th className="px-3 py-2 border text-center">Type</th>
                <th className="px-3 py-2 border text-center">Start</th>
                <th className="px-3 py-2 border text-center">End</th>
                <th className="px-3 py-2 border text-center">Days</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id || i}>
                  {/* Staff Dropdown (read-only roster) */}
                  <td className="border px-2 py-1 text-gray-700 w-64">
                    <Select
                      options={staffOptions}
                      value={
                        staffOptions.find((opt) => opt.value === row.staff_name) ||
                        (row.staff_name
                          ? { label: row.staff_name, value: row.staff_name }
                          : null)
                      }
                      onChange={(option: any) => {
                        const updated = [...rows]
                        updated[i].staff_name = option ? option.value : ""
                        setRows(updated)
                        debouncedSave(updated)
                      }}
                      placeholder="Select staff..."
                      isClearable
                      isSearchable
                      styles={customSelectStyles}
                    />
                  </td>

                  {/* Type Dropdown */}
                  <td className="border px-2 py-1 text-gray-700 w-40">
                    <Select
                      options={typeOptions}
                      value={
                        typeOptions.find((opt) => opt.value === row.type) || null
                      }
                      onChange={(option: any) => {
                        const updated = [...rows]
                        updated[i].type = option ? option.value : ""
                        setRows(updated)
                        debouncedSave(updated)
                      }}
                      placeholder="Select type..."
                      isClearable
                      styles={customSelectStyles}
                    />
                  </td>

                  {/* Start Date */}
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`start_${i}`}
                      label="Start"
                      type="date"
                      value={row.range?.start || ""}
                      onChange={(e) =>
                        handleRangeChange(i, "start", e.target.value)
                      }
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* End Date */}
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`end_${i}`}
                      label="End"
                      type="date"
                      value={row.range?.end || ""}
                      onChange={(e) => handleRangeChange(i, "end", e.target.value)}
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* Days */}
                  <td className="border px-2 py-1 text-center font-medium text-gray-700">
                    {row.days || 0}
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
