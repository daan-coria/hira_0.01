import { useEffect, useState, useCallback, useMemo } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"

type DateRange = { start: string; end: string }

type AvailabilityRow = {
  id?: number
  staff_name: string
  pto_range: DateRange
  loa_range: DateRange
  orientation_range: DateRange
  pto_days: number
  loa_days: number
  orientation_days: number
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

  // --- Sync staff names from Step 2 ---
  useEffect(() => {
    if (!Array.isArray(data?.resourceInput) || data.resourceInput.length === 0) return

    const updated = data.resourceInput.map((r: any, i: number) => {
      const name = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()
      const existing = rows.find((x) => x.staff_name === name)
      return (
        existing || {
          id: Date.now() + i,
          staff_name: name,
          pto_range: { start: "", end: "" },
          loa_range: { start: "", end: "" },
          orientation_range: { start: "", end: "" },
          pto_days: 0,
          loa_days: 0,
          orientation_days: 0,
        }
      )
    })

    setRows(updated)
    updateData("availabilityConfig", updated)
  }, [data?.resourceInput])

  // --- Helpers ---
  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 ? diff + 1 : 0
  }

  const handleRangeChange = (
    index: number,
    type: "pto" | "loa" | "orientation",
    field: "start" | "end",
    value: string
  ) => {
    const updated = rows.map((r, i) => {
      if (i !== index) return r
      const rangeKey =
        type === "pto" ? "pto_range" : type === "loa" ? "loa_range" : "orientation_range"
      const daysKey =
        type === "pto" ? "pto_days" : type === "loa" ? "loa_days" : "orientation_days"

      const newRange = { ...r[rangeKey], [field]: value }
      const newDays = calcDays(newRange.start, newRange.end)

      return { ...r, [rangeKey]: newRange, [daysKey]: newDays }
    })
    setRows(updated)
    debouncedSave(updated)
  }

  // --- Add Resource (syncs with Step 2) ---
  const handleAdd = () => {
    const newRow: AvailabilityRow = {
      id: Date.now(),
      staff_name: "",
      pto_range: { start: "", end: "" },
      loa_range: { start: "", end: "" },
      orientation_range: { start: "", end: "" },
      pto_days: 0,
      loa_days: 0,
      orientation_days: 0,
    }

    const updated = [...rows, newRow]
    setRows(updated)
    updateData("availabilityConfig", updated)

    const newResource = {
      id: newRow.id,
      first_name: "",
      last_name: "",
      position: "",
      unit_fte: 1,
      availability: "Day",
      weekend_group: "",
      vacancy_status: "Filled",
    }

    const resourceInputSafe = Array.isArray(data?.resourceInput)
      ? data.resourceInput
      : []
    const updatedResources = [...resourceInputSafe, newResource]
    updateData("resourceInput", updatedResources)
  }

  // --- Summary totals ---
  const summary = useMemo(() => {
    const perStaff = rows.map((r) => ({
      name: r.staff_name,
      pto: r.pto_days,
      loa: r.loa_days,
      orientation: r.orientation_days,
      total: r.pto_days + r.loa_days + r.orientation_days,
    }))
    const grandTotal = perStaff.reduce((sum, r) => sum + r.total, 0)
    return { perStaff, grandTotal }
  }, [rows])

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Resource Availability
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={handleAdd}>+ Add Resource</Button>
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
                <th className="px-3 py-2 border text-center" colSpan={3}>
                  PTO Period
                </th>
                <th className="px-3 py-2 border text-center" colSpan={3}>
                  LOA Period
                </th>
                <th className="px-3 py-2 border text-center" colSpan={3}>
                  Orientation Period
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="px-3 py-1 border"></th>
                <th className="px-3 py-1 border">Start</th>
                <th className="px-3 py-1 border">End</th>
                <th className="px-3 py-1 border text-right">Days</th>
                <th className="px-3 py-1 border">Start</th>
                <th className="px-3 py-1 border">End</th>
                <th className="px-3 py-1 border text-right">Days</th>
                <th className="px-3 py-1 border">Start</th>
                <th className="px-3 py-1 border">End</th>
                <th className="px-3 py-1 border text-right">Days</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id || i}>
                  <td className="border px-2 py-1 text-gray-700">
                    {row.staff_name || "(Unnamed)"}
                  </td>

                  {/* PTO Dates */}
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`pto_start_${i}`}
                      label=""
                      type="date"
                      value={row.pto_range.start}
                      onChange={(e) =>
                        handleRangeChange(i, "pto", "start", e.target.value)
                      }
                      className="!m-0 !p-1"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`pto_end_${i}`}
                      label=""
                      type="date"
                      value={row.pto_range.end}
                      onChange={(e) =>
                        handleRangeChange(i, "pto", "end", e.target.value)
                      }
                      className="!m-0 !p-1"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right font-medium text-gray-700">
                    {row.pto_days}
                  </td>

                  {/* LOA Dates */}
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`loa_start_${i}`}
                      label=""
                      type="date"
                      value={row.loa_range.start}
                      onChange={(e) =>
                        handleRangeChange(i, "loa", "start", e.target.value)
                      }
                      className="!m-0 !p-1"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`loa_end_${i}`}
                      label=""
                      type="date"
                      value={row.loa_range.end}
                      onChange={(e) =>
                        handleRangeChange(i, "loa", "end", e.target.value)
                      }
                      className="!m-0 !p-1"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right font-medium text-gray-700">
                    {row.loa_days}
                  </td>

                  {/* Orientation Dates */}
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`orientation_start_${i}`}
                      label=""
                      type="date"
                      value={row.orientation_range.start}
                      onChange={(e) =>
                        handleRangeChange(i, "orientation", "start", e.target.value)
                      }
                      className="!m-0 !p-1"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`orientation_end_${i}`}
                      label=""
                      type="date"
                      value={row.orientation_range.end}
                      onChange={(e) =>
                        handleRangeChange(i, "orientation", "end", e.target.value)
                      }
                      className="!m-0 !p-1"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right font-medium text-gray-700">
                    {row.orientation_days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      {summary.perStaff.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-md font-semibold text-gray-800 mb-2">
            Time-Off Summary
          </h4>
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-left">Staff</th>
                <th className="px-3 py-2 border text-right">PTO Days</th>
                <th className="px-3 py-2 border text-right">LOA Days</th>
                <th className="px-3 py-2 border text-right">Orientation Days</th>
                <th className="px-3 py-2 border text-right">Total Days Off</th>
              </tr>
            </thead>
            <tbody>
              {summary.perStaff.map((r, i) => (
                <tr key={i}>
                  <td className="border px-3 py-1">{r.name}</td>
                  <td className="border px-3 py-1 text-right">{r.pto}</td>
                  <td className="border px-3 py-1 text-right">{r.loa}</td>
                  <td className="border px-3 py-1 text-right">{r.orientation}</td>
                  <td className="border px-3 py-1 text-right font-semibold">
                    {r.total}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td className="border px-3 py-1 text-right" colSpan={4}>
                  Grand Total Days Off
                </td>
                <td className="border px-3 py-1 text-right">
                  {summary.grandTotal}
                </td>
              </tr>
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
