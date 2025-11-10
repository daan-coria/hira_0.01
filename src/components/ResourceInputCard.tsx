import { useState, useEffect, useCallback, useRef } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"
import Papa from "papaparse"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

type ResourceRow = {
  id?: number
  employee_id?: string
  first_name: string
  last_name: string
  position: string
  unit_fte: number
  shift: string
  weekend_group: "A" | "B" | "C" | "WC" | ""
  vacancy_status: string
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ResourceInputCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ResourceRow[]>([])
  const [saving, setSaving] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const weekendGroups = ["A", "B", "C", "WC"]

  const [filters, setFilters] = useState({
    vacancy_status: "",
    position: "",
    shift: "",
    weekend_group: "",
  })

  const debouncedSave = useCallback(
    debounce((updated: ResourceRow[]) => {
      setSaving(true)
      updateData("resourceInput", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // Mock initialization
  useEffect(() => {
    const resourceArray = Array.isArray(data?.resourceInput)
      ? (data.resourceInput as ResourceRow[])
      : []

    const mockEmployees: ResourceRow[] = [
      {
        id: 1,
        employee_id: "EMP001",
        first_name: "Emily",
        last_name: "Nguyen",
        position: "RN",
        unit_fte: 1,
        shift: "Day",
        weekend_group: "A",
        vacancy_status: "Filled",
      },
      {
        id: 2,
        employee_id: "EMP002",
        first_name: "Michael",
        last_name: "Lopez",
        position: "CNA",
        unit_fte: 0.8,
        shift: "Night",
        weekend_group: "B",
        vacancy_status: "Posted",
      },
      {
        id: 3,
        employee_id: "EMP003",
        first_name: "Sarah",
        last_name: "Johnson",
        position: "LPN",
        unit_fte: 1,
        shift: "Day",
        weekend_group: "C",
        vacancy_status: "Filled",
      },
    ]

    const merged = [
      ...mockEmployees.filter(
        (mock) => !resourceArray.some((e) => e.employee_id === mock.employee_id)
      ),
      ...resourceArray,
    ]

    setRows(merged)
    updateData("resourceInput", merged)
  }, [])

  const positions =
    Array.isArray(data.staffingConfig) && data.staffingConfig.length > 0
      ? data.staffingConfig.map((p: any) => p.role)
      : ["RN", "LPN", "CNA", "Clerk"]

  const getFilteredShifts = (position: string) => {
    if (!Array.isArray(data.shiftConfig)) return []
    return (data.shiftConfig || [])
      .filter((shift: any) => shift.roles?.includes(position))
      .map((shift: any) => shift.shift_label)
  }

  const [weekendGroupList, setWeekendGroupList] = useState<string[]>(weekendGroups)
  useEffect(() => {
    if (Array.isArray(data.staffingConfig)) {
      const groups = Array.from(
        new Set(
          (data.staffingConfig || [])
            .map((r: any) => r.weekend_rotation)
            .filter((g: string) => g && weekendGroups.includes(g))
        )
      )
      if (groups.length > 0) setWeekendGroupList(groups)
    }
  }, [data.staffingConfig])

  const handleChange = (index: number, field: keyof ResourceRow, value: any) => {
    const updated = [...rows]
    updated[index] = { ...updated[index], [field]: value }
    setRows(updated)
    debouncedSave(updated)
  }

  const removeRow = (id?: number, employee_id?: string) => {
    const updated = rows.filter(
      (r) => r.id !== id && r.employee_id !== employee_id
    )
    setRows(updated)
    updateData("resourceInput", updated)
  }

  const filteredRows = rows.filter((r) => {
    return (
      (!filters.vacancy_status || r.vacancy_status === filters.vacancy_status) &&
      (!filters.position || r.position === filters.position) &&
      (!filters.shift || r.shift === filters.shift) &&
      (!filters.weekend_group || r.weekend_group === filters.weekend_group)
    )
  })

  // Field labels from Excel (column A)
  const profileFields = [
    "HRIS ID",
    "Schedule System ID",
    "EHR ID",
    "First Name",
    "Last Name",
    "Full Name",
    "Primary Cost Center ID",
    "Primary Cost Center Name",
    "Primary Job Category ID",
    "Primary Job Category Name",
    "Primary Job Code ID",
  ]

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Resource Input</h3>
        {saving && <span className="text-sm text-gray-500">Saving…</span>}
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <p className="text-gray-500">No resource data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Vacancy Status</th>
                <th className="px-3 py-2 border">ID</th>
                <th className="px-3 py-2 border">First Name</th>
                <th className="px-3 py-2 border">Last Name</th>
                <th className="px-3 py-2 border">Position</th>
                <th className="px-3 py-2 border text-right">Unit FTE</th>
                <th className="px-3 py-2 border">Shift</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border text-center">Information</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => {
                const filteredShifts = getFilteredShifts(row.position)
                return (
                  <tr
                    key={row.id || i}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                  >
                    <td className="border px-2 py-1">
                      <Select
                        id={`vacancy_${i}`}
                        value={row.vacancy_status}
                        onChange={(e) =>
                          handleChange(i, "vacancy_status", e.target.value)
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select --</option>
                        <option value="Filled">Filled</option>
                        <option value="Posted">Posted</option>
                      </Select>
                    </td>

                    <td className="border px-2 py-1 text-center">
                      {row.employee_id}
                    </td>
                    <td className="border px-2 py-1">{row.first_name}</td>
                    <td className="border px-2 py-1">{row.last_name}</td>
                    <td className="border px-2 py-1">{row.position}</td>
                    <td className="border px-2 py-1 text-right">{row.unit_fte}</td>
                    <td className="border px-2 py-1">{row.shift}</td>
                    <td className="border px-2 py-1 text-center">
                      {row.weekend_group}
                    </td>

                    {/* Information Column */}
                    <td className="border px-2 py-1 text-center">
                      <Button
                        variant="ghost"
                        className="text-blue-600 font-bold"
                        onClick={() => setSelectedProfile(row.employee_id || "")}
                      >
                        +
                      </Button>
                    </td>

                    {/* Actions */}
                    <td className="border px-2 py-1 text-center">
                      <Button
                        onClick={() => removeRow(row.id, row.employee_id)}
                        variant="ghost"
                        className="!px-2 !py-1 text-xs text-red-600"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile Popup */}
      {selectedProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg shadow-xl w-[450px] max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Employee Profile
              </h3>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* Profile Fields */}
            <div className="space-y-3">
              {profileFields.map((label) => (
                <div
                  key={label}
                  className="flex justify-between items-center border-b pb-1"
                >
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-500">—</span>
                </div>
              ))}
            </div>
          </div>
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
