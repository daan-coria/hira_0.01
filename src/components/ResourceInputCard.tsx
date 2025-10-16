import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"

type ResourceRow = {
  id?: number
  employee_id?: string
  first_name: string
  last_name: string
  position: string
  unit_fte: number
  availability: string
  weekend_group: string
  vacancy_status: string
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function ResourceInputCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ResourceRow[]>([])
  const [saving, setSaving] = useState(false)

  // Debounced autosave for smoother UX
  const debouncedSave = useCallback(
    debounce((updated: ResourceRow[]) => {
      setSaving(true)
      updateData("resourceInput", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    []
  )

  useEffect(() => {
    if (data.resourceInput?.length > 0) {
      setRows(data.resourceInput)
    }
  }, [data.resourceInput])

  // Handle field edits
  const handleChange = (index: number, field: keyof ResourceRow, value: any) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: ResourceRow = {
      id: Date.now(),
      employee_id: `EMP${String(rows.length + 1).padStart(3, "0")}`,
      first_name: "",
      last_name: "",
      position: "",
      unit_fte: 1,
      availability: "Day",
      weekend_group: "",
      vacancy_status: "Filled",
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("resourceInput", updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Resource Input</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addRow}>+ Add Resource</Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No resource data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Employee ID</th>
                <th className="px-3 py-2 border">First Name</th>
                <th className="px-3 py-2 border">Last Name</th>
                <th className="px-3 py-2 border">Position</th>
                <th className="px-3 py-2 border text-right">Unit FTE</th>
                <th className="px-3 py-2 border">Availability</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border">Vacancy Status</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Employee ID */}
                  <td className="border px-2 py-1 text-gray-600">{row.employee_id}</td>

                  {/* First Name */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`fname_${i}`}
                      label=""
                      value={row.first_name}
                      onChange={(e) => handleChange(i, "first_name", e.target.value)}
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* Last Name */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`lname_${i}`}
                      label=""
                      value={row.last_name}
                      onChange={(e) => handleChange(i, "last_name", e.target.value)}
                      className="!m-0 !p-1"
                    />
                  </td>

                  {/* Position */}
                  <td className="border px-2 py-1">
                    <Select
                      id={`pos_${i}`}
                      label=""
                      value={row.position}
                      onChange={(e) => handleChange(i, "position", e.target.value)}
                      className="!m-0 !p-1"
                    >
                      <option value="">-- Select --</option>
                      <option value="RN">RN</option>
                      <option value="LPN">LPN</option>
                      <option value="CNA">CNA</option>
                      <option value="Clerk">Clerk</option>
                    </Select>
                  </td>

                  {/* Unit FTE */}
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`fte_${i}`}
                      label=""
                      type="number"
                      min={0}
                      step={0.1}
                      value={row.unit_fte}
                      onChange={(e) =>
                        handleChange(i, "unit_fte", Number(e.target.value))
                      }
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  </td>

                  {/* Availability */}
                  <td className="border px-2 py-1">
                    <Select
                      id={`avail_${i}`}
                      label=""
                      value={row.availability}
                      onChange={(e) =>
                        handleChange(i, "availability", e.target.value)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="Day">Day</option>
                      <option value="Night">Night</option>
                    </Select>
                  </td>

                  {/* Weekend Group */}
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

                  {/* Vacancy Status */}
                  <td className="border px-2 py-1">
                    <Select
                      id={`vacancy_${i}`}
                      label=""
                      value={row.vacancy_status}
                      onChange={(e) =>
                        handleChange(i, "vacancy_status", e.target.value)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="Filled">Filled</option>
                      <option value="Vacant">Vacant</option>
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
