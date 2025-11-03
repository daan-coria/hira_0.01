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
  availability: string
  weekend_group: "A" | "B" | "C" | "WC" | ""
  vacancy_status: string
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ResourceInputCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ResourceRow[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ Unified weekend groups
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

  // ✅ Positions from Step 2 (StaffingConfig) or fallback
  const positions =
    Array.isArray(data.staffingConfig) && data.staffingConfig.length > 0
      ? data.staffingConfig.map((p: any) => p.role)
      : ["RN", "LPN", "CNA", "Clerk"]

  // ✅ Availability options from Step 3 (ShiftConfig)
  const [availabilityOptions, setAvailabilityOptions] = useState<string[]>([])
  useEffect(() => {
    if (Array.isArray(data.shiftConfig)) {
      const labels = Array.from(
        new Set(
          (data.shiftConfig || [])
            .map((s: any) => s.shift_label)
            .filter((x: string) => x && x.trim())
        )
      )
      setAvailabilityOptions(labels)
    }
  }, [data.shiftConfig])

  // ✅ Filter availability by position type (from StaffingConfig)
  const getFilteredAvailability = (position: string) => {
    if (!Array.isArray(data.staffingConfig)) return availabilityOptions
    const allowedTypes = data.staffingConfig
      .filter((cfg: any) => cfg.role === position)
      .map((cfg: any) => cfg.type)
    if (allowedTypes.length === 0) return availabilityOptions
    return availabilityOptions.filter((opt) =>
      allowedTypes.some((type: string) =>
        opt.toLowerCase().includes(type.toLowerCase())
      )
    )
  }

  // ✅ Weekend group source (from Step 2 or fallback)
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

  // ✅ Handle inline changes
  const handleChange = (index: number, field: keyof ResourceRow, value: any) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
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
      availability: "",
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

  // ✅ CSV Upload Handler (weekend groups normalized)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newRows = results.data as ResourceRow[]
        const merged = [...rows]

        for (const newRow of newRows) {
          newRow.weekend_group = normalizeGroup(newRow.weekend_group)
          const matchIndex = merged.findIndex(
            (r) =>
              r.employee_id === newRow.employee_id ||
              (r.first_name === newRow.first_name && r.last_name === newRow.last_name)
          )
          if (matchIndex >= 0) merged[matchIndex] = { ...merged[matchIndex], ...newRow }
          else merged.push({ ...newRow, id: Date.now() })
        }

        setRows(merged)
        updateData("resourceInput", merged)
        Swal.fire("Upload Complete", "Roster processed successfully!", "success")
      },
    })
  }

  // ✅ Normalize weekend group from CSV or legacy data
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

  // ✅ Export CSV
  const handleExport = () => {
    if (rows.length === 0) {
      Swal.fire("No Data", "There are no rows to export.", "info")
      return
    }
    const csv = Papa.unparse(rows.map(({ id, ...r }) => r))
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = "resource_roster.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  // ✅ Render
  return (
    <Card className="p-4 space-y-4">
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
            aria-label="Upload CSV"
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
              if (rows.length === 0) return
              Swal.fire({
                title: "Clear All Resources?",
                text: "This will remove all rows permanently. Continue?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, clear all",
              }).then((result) => {
                if (result.isConfirmed) {
                  setRows([])
                  updateData("resourceInput", [])
                  Swal.fire("Cleared!", "All resources have been removed.", "success")
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
                <th className="px-3 py-2 border">Employee ID</th>
                <th className="px-3 py-2 border">Vacancy Status</th>
                <th className="px-3 py-2 border">First Name</th>
                <th className="px-3 py-2 border">Last Name</th>
                <th className="px-3 py-2 border">Position</th>
                <th className="px-3 py-2 border text-right">Unit FTE</th>
                <th className="px-3 py-2 border">Availability</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => {
                const isPosted = row.vacancy_status === "Posted"
                const filteredAvailability = getFilteredAvailability(row.position)

                return (
                  <tr
                    key={row.id || i}
                    className={`odd:bg-white even:bg-gray-50 hover:bg-gray-100 ${
                      isPosted ? "opacity-70" : ""
                    }`}
                  >
                    {/* Employee ID */}
                    <td className="border px-2 py-1 text-center">
                      <Input
                        id={`employee_id-${row.id || i}`}
                        value={row.employee_id || ""}
                        onChange={(e) => handleChange(i, "employee_id", e.target.value)}
                        placeholder="ID"
                        disabled={isPosted}
                        className={`!m-0 !p-1 w-24 text-center ${
                          isPosted ? "bg-gray-100 text-gray-400" : ""
                        }`}
                      />
                    </td>

                    {/* Vacancy Status */}
                    <td className="border px-2 py-1">
                      <Select
                        label=""
                        id={`vacancy_${i}`}
                        value={row.vacancy_status}
                        onChange={(e) =>
                          handleChange(i, "vacancy_status", e.target.value)
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Status --</option>
                        <option value="Filled">Filled</option>
                        <option value="Posted">Posted</option>
                      </Select>
                    </td>

                    {/* First Name */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`first_name-${row.id || i}`}
                        value={row.first_name}
                        onChange={(e) => handleChange(i, "first_name", e.target.value)}
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
                        id={`last_name-${row.id || i}`}
                        value={row.last_name}
                        onChange={(e) => handleChange(i, "last_name", e.target.value)}
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
                        label=""
                        id={`position_${i}`}
                        value={row.position}
                        onChange={(e) => handleChange(i, "position", e.target.value)}
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
                        id={`unit_fte-${row.id || i}`}
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
                        label=""
                        id={`availability_${i}`}
                        value={row.availability}
                        onChange={(e) =>
                          handleChange(i, "availability", e.target.value)
                        }
                        disabled={filteredAvailability.length === 0}
                        className="!m-0 !p-1"
                      >
                        <option value="">
                          {filteredAvailability.length === 0
                            ? "No shifts for role"
                            : "-- Select Shift --"}
                        </option>
                        {filteredAvailability.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Select>
                    </td>

                    {/* Weekend Group */}
                    <td className="border px-2 py-1">
                      <Select
                        label=""
                        id={`weekend_${i}`}
                        value={row.weekend_group}
                        onChange={(e) =>
                          handleChange(i, "weekend_group", e.target.value as any)
                        }
                        disabled={weekendGroupList.length === 0}
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select --</option>
                        {weekendGroupList.map((g) => (
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
