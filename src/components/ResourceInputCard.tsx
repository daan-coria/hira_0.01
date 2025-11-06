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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const weekendGroups = ["A", "B", "C", "WC"]

  // ✅ Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: ResourceRow[]) => {
      setSaving(true)
      updateData("resourceInput", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // ✅ Initialize from stored data
  useEffect(() => {
    const resourceArray = Array.isArray(data?.resourceInput)
      ? (data.resourceInput as ResourceRow[])
      : []
    if (resourceArray.length > 0) setRows(resourceArray)
  }, [data?.resourceInput])

  // ✅ Positions from Step 2
  const positions =
    Array.isArray(data.staffingConfig) && data.staffingConfig.length > 0
      ? data.staffingConfig.map((p: any) => p.role)
      : ["RN", "LPN", "CNA", "Clerk"]

  // ✅ Filter shifts by role (NEW LOGIC)
  const getFilteredShifts = (position: string) => {
    if (!Array.isArray(data.shiftConfig)) return []
    return (data.shiftConfig || [])
      .filter((shift: any) => shift.roles?.includes(position))
      .map((shift: any) => shift.shift_label)
  }

  // ✅ Weekend group list
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

  // ✅ Handle changes (duplicate check unchanged)
  const handleChange = async (index: number, field: keyof ResourceRow, value: any) => {
    const updated = [...rows]
    const prevValue = updated[index][field]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "employee_id" || field === "id") {
      const duplicateIndex = updated.findIndex(
        (r, i) => i !== index && r.employee_id === value
      )

      if (duplicateIndex !== -1) {
        const existing = updated[duplicateIndex]
        const current = updated[index]
        const differs =
          existing.first_name !== current.first_name ||
          existing.last_name !== current.last_name ||
          existing.position !== current.position

        if (differs) {
          const result = await Swal.fire({
            title: "Duplicate ID Detected",
            text: "An entry with this ID already exists but has different details. Do you want to overwrite it?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, overwrite",
            cancelButtonText: "No, keep both",
          })

          if (result.isConfirmed) {
            updated[duplicateIndex] = { ...current }
            Swal.fire("Overwritten", "Existing record updated successfully.", "success")
          } else {
            if (typeof prevValue !== "undefined") {
              (updated[index] as Record<string, any>)[field] = prevValue
            }
          }
        }
      }
    }

    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Add new row
  const addRow = () => {
    const newRow: ResourceRow = {
      id: Date.now(),
      employee_id: "",
      first_name: "",
      last_name: "",
      position: "",
      unit_fte: 1,
      shift: "",
      weekend_group: "",
      vacancy_status: "",
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Remove row
  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("resourceInput", updated)
  }

  // ✅ CSV Upload Handler (with duplicate ID logic)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newRows = results.data as ResourceRow[]
        let merged = [...rows]

        for (const newRow of newRows) {
          newRow.weekend_group = normalizeGroup(newRow.weekend_group)
          const matchIndex = merged.findIndex((r) => r.employee_id === newRow.employee_id)

          if (matchIndex >= 0) {
            const existing = merged[matchIndex]
            const differs =
              existing.first_name !== newRow.first_name ||
              existing.last_name !== newRow.last_name ||
              existing.position !== newRow.position

            if (differs) {
              const result = await Swal.fire({
                title: "Duplicate ID in CSV",
                text: `ID ${newRow.employee_id} already exists with different details. Overwrite?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, overwrite",
                cancelButtonText: "No, skip",
              })
              if (result.isConfirmed) merged[matchIndex] = { ...existing, ...newRow }
            }
          } else {
            merged.push({ ...newRow, id: Date.now() })
          }
        }

        setRows(merged)
        updateData("resourceInput", merged)
        Swal.fire("Upload Complete", "Roster processed successfully!", "success")
      },
    })
  }

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

  // ✅ Export CSV (renamed columns)
  const handleExport = () => {
    if (rows.length === 0) {
      Swal.fire("No Data", "There are no rows to export.", "info")
      return
    }
    const csv = Papa.unparse(
      rows.map(({ id, ...r }) => ({
        ID: r.employee_id || "",
        First_Name: r.first_name,
        Last_Name: r.last_name,
        Position: r.position,
        Unit_FTE: r.unit_fte,
        Shift: r.shift,
        Weekend_Group: r.weekend_group,
        Vacancy_Status: r.vacancy_status,
      }))
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = "resource_roster.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
  <Card className="p-4 space-y-4">
    {/* Header */}
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold text-gray-800">Resource Input</h3>
      <div className="flex items-center gap-3">
        {saving && <span className="text-sm text-gray-500">Saving…</span>}

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          title="Upload CSV file"
          aria-label="Upload CSV file"
        />

        <Button onClick={() => fileInputRef.current?.click()}>Upload CSV</Button>
        <Button
          onClick={handleExport}
          variant="ghost"
          className="border border-gray-300 text-gray-700"
        >
          Export CSV
        </Button>

        <Button
          variant="ghost"
          className="border border-red-400 text-red-600 hover:bg-red-50"
          onClick={() => {
            Swal.fire({
              title: "Clear All?",
              text: "This will remove all rows permanently.",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#d33",
              cancelButtonColor: "#3085d6",
              confirmButtonText: "Yes, clear all",
            }).then((result) => {
              if (result.isConfirmed) {
                setRows([])
                updateData("resourceInput", [])
                Swal.fire("Cleared!", "All resources removed.", "success")
              }
            })
          }}
        >
          🗑 Clear All
        </Button>

        <Button onClick={addRow} className="bg-green-600 hover:bg-green-700">
          + Add Resource
        </Button>
      </div>
    </div>

    {/* Table */}
    {rows.length === 0 ? (
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
              <th className="px-3 py-2 border text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const isPosted = row.vacancy_status === "Posted"
              const filteredShifts = getFilteredShifts(row.position)

              return (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  {/* Vacancy Status */}
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

                  {/* ID */}
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`employee_id-${i}`}
                      value={row.employee_id || ""}
                      onChange={(e) =>
                        handleChange(i, "employee_id", e.target.value)
                      }
                      placeholder="ID"
                      className="!m-0 !p-1 w-24 text-center"
                    />
                  </td>

                  {/* First Name */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`first_name-${i}`}
                      value={row.first_name}
                      onChange={(e) =>
                        handleChange(i, "first_name", e.target.value)
                      }
                      placeholder="First"
                      disabled={isPosted}
                      className={`!m-0 !p-1 ${
                        isPosted ? "bg-gray-100 text-gray-400" : ""
                      }`}
                    />
                  </td>

                  {/* Last Name */}
                  <td className="border px-2 py-1">
                    <Input
                      id={`last_name-${i}`}
                      value={row.last_name}
                      onChange={(e) =>
                        handleChange(i, "last_name", e.target.value)
                      }
                      placeholder="Last"
                      disabled={isPosted}
                      className={`!m-0 !p-1 ${
                        isPosted ? "bg-gray-100 text-gray-400" : ""
                      }`}
                    />
                  </td>

                  {/* Position */}
                  <td className="border px-2 py-1">
                    <Select
                      id={`position_${i}`}
                      value={row.position}
                      onChange={(e) =>
                        handleChange(i, "position", e.target.value)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="">-- Select --</option>
                      {positions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </td>

                  {/* Unit FTE */}
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`fte-${i}`}
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

                  {/* ✅ Shift (Updated filtering logic) */}
                  <td className="border px-2 py-1">
                    <Select
                      id={`shift_${i}`}
                      value={row.shift}
                      onChange={(e) =>
                        handleChange(i, "shift", e.target.value)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="">-- Select Shift --</option>
                      {filteredShifts.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </td>

                  {/* Weekend Group */}
                  <td className="border px-2 py-1 text-center">
                    <Select
                      id={`weekend_${i}`}
                      value={row.weekend_group}
                      onChange={(e) =>
                        handleChange(i, "weekend_group", e.target.value)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="">-- Select --</option>
                      {weekendGroupList.map((g) => (
                        <option key={g} value={g}>
                          {g}
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
              )
            })}
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
