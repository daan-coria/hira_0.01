import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import InfoButton from "@/components/ui/InfoButton"
import debounce from "lodash.debounce"

type ShiftRow = {
  id?: number
  shift_label: string
  start_time: string
  end_time: string
  hours: number
  weekend_group: "A" | "B" | "C" | "WC" | ""
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function ShiftConfigCard({ onNext, onPrev }: Props) {
  const { updateData, data } = useApp()
  const [rows, setRows] = useState<ShiftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseURL = `${window.location.origin}/mockdata`
  const weekendGroups = ["A", "B", "C", "WC"]

  // ✅ Debounced save
  const debouncedSave = useCallback(
    debounce((updated: ShiftRow[]) => {
      setSaving(true)
      updateData("shiftConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // ✅ Load or fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${baseURL}/shift-config.json`)
        if (!res.ok) throw new Error("Missing shift config")
        const data = await res.json()
        const normalized = data.map((s: ShiftRow) => ({
          ...s,
          weekend_group: normalizeGroup(s.weekend_group),
        }))
        setRows(normalized)
        updateData("shiftConfig", normalized)
      } catch {
        console.warn("⚠️ Using fallback shifts")
        setRows(fallbackData)
        updateData("shiftConfig", fallbackData)
        setError("Loaded fallback shifts.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ✅ Normalize any previous text values
  const normalizeGroup = (val: any): "A" | "B" | "C" | "WC" | "" => {
    if (!val) return ""
    const t = val.toString().toUpperCase()
    if (["A", "B", "C", "WC"].includes(t)) return t as any
    if (t.includes("1")) return "A"
    if (t.includes("2")) return "B"
    if (t.includes("3")) return "C"
    if (t.includes("W")) return "WC"
    return ""
  }

  // ✅ Fallback shifts
  const fallbackData: ShiftRow[] = [
    {
      id: 1,
      shift_label: "Day Shift",
      start_time: "07:00",
      end_time: "15:00",
      hours: 8,
      weekend_group: "A",
    },
    {
      id: 2,
      shift_label: "Evening Shift",
      start_time: "15:00",
      end_time: "23:00",
      hours: 8,
      weekend_group: "B",
    },
    {
      id: 3,
      shift_label: "Night Shift",
      start_time: "23:00",
      end_time: "07:00",
      hours: 8,
      weekend_group: "C",
    },
    {
      id: 4,
      shift_label: "Weekend Coverage",
      start_time: "07:00",
      end_time: "19:00",
      hours: 12,
      weekend_group: "WC",
    },
  ]

  // ✅ Handle change
  const handleChange = (i: number, field: keyof ShiftRow, value: any) => {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: ShiftRow = {
      id: Date.now(),
      shift_label: "",
      start_time: "",
      end_time: "",
      hours: 8,
      weekend_group: "",
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

  return (
    <Card className="p-5 rounded-xl shadow-sm divide-y divide-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Shift Configuration</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addRow}>+ Add Shift</Button>
        </div>
      </div>

      {error && (
        <p className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded mb-2">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading shift configuration...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-md">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 border">Shift Label</th>
                <th className="px-3 py-2 border">Start Time</th>
                <th className="px-3 py-2 border">End Time</th>
                <th className="px-3 py-2 border text-right">Hours</th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    Weekend Group
                    <InfoButton text="Assign this shift to a weekend group (A, B, C or WC)." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                >
                  <td className="border px-2 py-1">
                    <Input
                      id={`label_${i}`}
                      value={row.shift_label}
                      onChange={(e) => handleChange(i, "shift_label", e.target.value)}
                      placeholder="Shift Label"
                      className="!m-0 !p-1 w-full"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`start_${i}`}
                      type="time"
                      value={row.start_time}
                      onChange={(e) => handleChange(i, "start_time", e.target.value)}
                      className="!m-0 !p-1 w-28 text-center"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`end_${i}`}
                      type="time"
                      value={row.end_time}
                      onChange={(e) => handleChange(i, "end_time", e.target.value)}
                      className="!m-0 !p-1 w-28 text-center"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`hours_${i}`}
                      type="number"
                      value={row.hours}
                      min={1}
                      max={24}
                      onChange={(e) => handleChange(i, "hours", Number(e.target.value))}
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right">
                    <Select
                      label="Weekend Group"
                      id={`weekend_${i}`}
                      value={row.weekend_group}
                      onChange={(e) =>
                        handleChange(i, "weekend_group", e.target.value as any)
                      }
                      className="!m-0 !p-1 w-28"
                    >
                      <option value="">-- Select --</option>
                      {weekendGroups.map((g) => (
                        <option key={g} value={g}>
                          Group {g}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-red-600 hover:bg-red-50"
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
