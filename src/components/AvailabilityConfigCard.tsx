import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"

type AvailabilityRow = {
  id?: number
  staff_name: string
  weekend_group: string
  pto_days: number
  loa_days: number
  available_shifts: number
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function AvailabilityConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<AvailabilityRow[]>([])
  const [saving, setSaving] = useState(false)

  // --- Debounced save handler (to prevent too many re-renders) ---
  const debouncedSave = useCallback(
    debounce((updated: AvailabilityRow[]) => {
      setSaving(true)
      updateData("availabilityConfig", updated)
      setTimeout(() => setSaving(false), 600) // small visual delay
    }, 500),
    []
  )

  // Sync names from resourceInput (Step 2)
  useEffect(() => {
    if (data.resourceInput.length > 0) {
      const updated = data.resourceInput.map((r: any, i: number) => {
        const name = `${r.first_name} ${r.last_name}`.trim()
        const existing = rows.find((x) => x.staff_name === name)
        return (
          existing || {
            id: Date.now() + i,
            staff_name: name,
            weekend_group: r.weekend_group || "",
            pto_days: 0,
            loa_days: 0,
            available_shifts: 0,
          }
        )
      })
      setRows(updated)
      updateData("availabilityConfig", updated)
    }
  }, [data.resourceInput])

  // Generic handler for changes
  const handleChange = (
    index: number,
    field: keyof AvailabilityRow,
    value: any
  ) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  const handleAdd = () => {
    const newRow: AvailabilityRow = {
      id: Date.now(),
      staff_name: "",
      weekend_group: "",
      pto_days: 0,
      loa_days: 0,
      available_shifts: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    updateData("availabilityConfig", updated)
  }

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

      {rows.length === 0 ? (
        <p className="text-gray-500">No availability data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Staff Name</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border">PTO Days</th>
                <th className="px-3 py-2 border">LOA Days</th>
                <th className="px-3 py-2 border">Available Shifts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.staff_name}_${i}`}>
                  <td className="border px-2 py-1">{row.staff_name}</td>

                  <td className="border px-2 py-1">
                    <Select
                      id={`weekend_${i}`}
                      label=""
                      value={row.weekend_group}
                      onChange={(e) =>
                        handleChange(i, "weekend_group", e.target.value)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="">--</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="WC">WC</option>
                    </Select>
                  </td>

                  <td className="border px-2 py-1">
                    <Input
                      id={`pto_${i}`}
                      label=""
                      type="number"
                      min={0}
                      value={row.pto_days}
                      onChange={(e) =>
                        handleChange(i, "pto_days", Number(e.target.value))
                      }
                      className="!m-0 !p-1 w-20"
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <Input
                      id={`loa_${i}`}
                      label=""
                      type="number"
                      min={0}
                      value={row.loa_days}
                      onChange={(e) =>
                        handleChange(i, "loa_days", Number(e.target.value))
                      }
                      className="!m-0 !p-1 w-20"
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <Input
                      id={`avail_${i}`}
                      label=""
                      type="number"
                      min={0}
                      value={row.available_shifts}
                      onChange={(e) =>
                        handleChange(
                          i,
                          "available_shifts",
                          Number(e.target.value)
                        )
                      }
                      className="!m-0 !p-1 w-20"
                    />
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
