import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

type DateRange = { start: string; end: string }

type AvailabilityRow = {
  id?: number
  staff_name: string
  type: "PTO" | "LOA" | "Orientation" | ""
  range: DateRange
  days: number
  weekend_group: "A" | "B" | "C" | "WC" | ""
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function AvailabilityConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<AvailabilityRow[]>([])
  const [saving, setSaving] = useState(false)

  // ✅ Unified weekend groups
  const weekendGroups = ["A", "B", "C", "WC"]

  // ✅ Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: AvailabilityRow[]) => {
      setSaving(true)
      updateData("availabilityConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // ✅ Load from stored data or fallback
  useEffect(() => {
    const arr = Array.isArray(data?.availabilityConfig)
      ? (data.availabilityConfig as AvailabilityRow[])
      : []
    // ✅ Ensure every row has a defined range object
    const normalized = arr.map((r) => ({
      ...r,
      range: r.range || { start: "", end: "" },
    }))
    setRows(normalized)
  }, [data?.availabilityConfig])

  // ✅ Handle change
  const handleChange = (index: number, field: keyof AvailabilityRow, value: any) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Handle date range change
  const handleRangeChange = (index: number, key: keyof DateRange, value: string) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, range: { ...r.range, [key]: value } } : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Add new row
  const addRow = () => {
    const newRow: AvailabilityRow = {
      id: Date.now(),
      staff_name: "",
      type: "",
      range: { start: "", end: "" },
      days: 0,
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
    updateData("availabilityConfig", updated)
  }

  // ✅ Clear all
  const clearAll = () => {
    if (rows.length === 0) return
    Swal.fire({
      title: "Clear All?",
      text: "This will remove all availability records.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear all",
    }).then((result) => {
      if (result.isConfirmed) {
        setRows([])
        updateData("availabilityConfig", [])
        Swal.fire("Cleared!", "All data removed.", "success")
      }
    })
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Availability Configuration</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button variant="ghost" onClick={clearAll} className="border border-red-400 text-red-600 hover:bg-red-50">
            🗑 Clear All
          </Button>
          <Button onClick={addRow} className="bg-green-600 hover:bg-green-700">
            + Add Row
          </Button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-gray-500">No availability data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Staff Name</th>
                <th className="px-3 py-2 border">Type</th>
                <th className="px-3 py-2 border">Start Date</th>
                <th className="px-3 py-2 border">End Date</th>
                <th className="px-3 py-2 border text-right">Days</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id || i} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  {/* Staff Name */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`staff_${i}`}
                      value={row.staff_name}
                      onChange={(e) => handleChange(i, "staff_name", e.target.value)}
                      placeholder="Full name"
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* Type */}
                  <td className="border px-2 py-1">
                    <Select
                      id={`type_${i}`}
                      label=""
                      value={row.type}
                      onChange={(e) => handleChange(i, "type", e.target.value as any)}
                      className="!m-0 !p-1"
                    >
                      <option value="">-- Select --</option>
                      <option value="PTO">PTO</option>
                      <option value="LOA">LOA</option>
                      <option value="Orientation">Orientation</option>
                    </Select>
                  </td>

                  {/* Start Date */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`start_${i}`}
                      type="date"
                      value={row.range.start}
                      onChange={(e) => handleRangeChange(i, "start", e.target.value)}
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* End Date */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`end_${i}`}
                      type="date"
                      value={row.range.end}
                      onChange={(e) => handleRangeChange(i, "end", e.target.value)}
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* Days */}
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`days_${i}`}
                      type="number"
                      min={0}
                      value={row.days}
                      onChange={(e) =>
                        handleChange(i, "days", Number(e.target.value))
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
