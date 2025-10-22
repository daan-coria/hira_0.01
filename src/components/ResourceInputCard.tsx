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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: ResourceRow[]) => {
      setSaving(true)
      updateData("resourceInput", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // Initialize from stored data
  useEffect(() => {
    const resourceArray = Array.isArray(data?.resourceInput)
      ? (data.resourceInput as ResourceRow[])
      : []
    if (resourceArray.length > 0) {
      setRows(resourceArray)
    }
  }, [data?.resourceInput])

  // Dynamic positions from Position Setup Page
  const positions: string[] = (data.positions as string[]) || ["RN", "LPN", "CNA", "Clerk"]

  // Handle inline edits
  const handleChange = (index: number, field: keyof ResourceRow, value: any) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    setRows(updated)
    debouncedSave(updated)
  }

  // Add row manually
  const addRow = () => {
    const newRow: ResourceRow = {
      id: Date.now(),
      employee_id: "",
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

  // Remove row
  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("resourceInput", updated)
  }

  // ✅ CSV Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newRows = results.data as ResourceRow[]

        for (const newRow of newRows) {
          const match = rows.find(
            (r) =>
              r.employee_id === newRow.employee_id ||
              (r.first_name === newRow.first_name && r.last_name === newRow.last_name)
          )

          if (match) {
            const result = await Swal.fire({
              title: "Duplicate Employee Found",
              html: `
                <p><strong>${newRow.first_name} ${newRow.last_name}</strong> already exists.</p>
                <p>Do you want to <b>update</b> their information or <b>ignore</b> this entry?</p>
              `,
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Update",
              cancelButtonText: "Ignore",
            })

            if (result.isConfirmed) {
              setRows((prev) =>
                prev.map((r) =>
                  r.employee_id === newRow.employee_id
                    ? { ...r, ...newRow }
                    : r.first_name === newRow.first_name &&
                      r.last_name === newRow.last_name
                    ? { ...r, ...newRow }
                    : r
                )
              )
            }
          } else {
            setRows((prev) => [...prev, { ...newRow, id: Date.now() }])
          }
        }

        updateData("resourceInput", newRows)
        Swal.fire("Upload Complete", "Roster processed successfully!", "success")
      },
    })
  }

  // ✅ Export CSV
  const handleExport = () => {
    if (rows.length === 0) {
      Swal.fire("No Data", "There are no rows to export.", "info")
      return
    }

    const csv = Papa.unparse(rows.map(({ id, ...r }) => r)) // omit internal id
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "resource_roster.csv")
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Resource Input</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}

          {/* ✅ Hidden CSV Upload Input */}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload CSV File"
            title="Upload CSV File"
          />

          {/* Buttons */}
          <Button onClick={() => fileInputRef.current?.click()}>Upload CSV</Button>
          <Button onClick={handleExport} variant="ghost" className="border border-gray-300 text-gray-700">
            Export CSV
          </Button>
          <Button onClick={addRow}>+ Add Resource</Button>
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
                <th className="px-3 py-2 border">First Name</th>
                <th className="px-3 py-2 border">Last Name</th>
                <th className="px-3 py-2 border">Position</th>
                <th className="px-3 py-2 border text-right">Unit FTE</th>
                <th className="px-3 py-2 border">Availability</th>
                <th className="px-3 py-2 border">Weekend Group</th>
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td className="border px-2 py-1">
                    <Input
                      id={`emp_${i}`}
                      label=""
                      value={row.employee_id}
                      onChange={(e) =>
                        handleChange(i, "employee_id", e.target.value)
                      }
                      placeholder="Employee ID"
                      className="!m-0 !p-1 w-24 text-center"
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <Input
                      id={`fname_${i}`}
                      label=""
                      value={row.first_name}
                      onChange={(e) =>
                        handleChange(i, "first_name", e.target.value)
                      }
                      placeholder="First Name"
                      className="!m-0 !p-1"
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <Input
                      id={`lname_${i}`}
                      label=""
                      value={row.last_name}
                      onChange={(e) =>
                        handleChange(i, "last_name", e.target.value)
                      }
                      placeholder="Last Name"
                      className="!m-0 !p-1"
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <Select
                      id={`pos_${i}`}
                      label=""
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
                      <option value="LOA">LOA</option>
                      <option value="Terminated">Terminated</option>
                    </Select>
                  </td>

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
