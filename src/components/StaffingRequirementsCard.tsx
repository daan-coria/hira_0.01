import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

type StaffingRequirementRow = {
  id?: number
  role: string
  required_fte: number
  notes?: string
}

export default function StaffingRequirementsCard() {
  const { state } = useApp()
  const { facilitySetup, toolType } = state

  const [rows, setRows] = useState<StaffingRequirementRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (toolType === "IP" && facilitySetup) {
      fetchRequirements()
    }
  }, [facilitySetup, toolType])

  const fetchRequirements = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)

      const query = new URLSearchParams({
        facility: facilitySetup.facility,
        department: facilitySetup.department,
        costCenter: facilitySetup.costCenter,
        bedCount: String(facilitySetup.bedCount),
        start: facilitySetup.dateRange.start,
        end: facilitySetup.dateRange.end,
      })

      const res = await fetch(`/api/staffing-requirements?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load staffing requirements", err)
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: StaffingRequirementRow) => {
    try {
      if (!facilitySetup) return
      const method = row.id ? "PUT" : "POST"
      const url = row.id
        ? `/api/staffing-requirements/${row.id}`
        : "/api/staffing-requirements"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      await fetchRequirements()
    } catch (err) {
      console.error("Failed to save staffing requirement", err)
    }
  }

  const removeRow = async (id?: number) => {
    try {
      if (!facilitySetup) return
      if (id) {
        await fetch(`/api/staffing-requirements/${id}`, { method: "DELETE" })
        await fetchRequirements()
      }
    } catch (err) {
      console.error("Failed to delete staffing requirement", err)
    }
  }

  // Render only for IP tool
  if (toolType !== "IP") return null

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Requirements (IP Only)</h3>
        <Button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { role: "", required_fte: 0, notes: "" },
            ])
          }
        >
          + Add Requirement
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading staffing requirements...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Required FTE</th>
                <th className="px-3 py-2 border">Notes</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No staffing requirements added yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    {/* Role */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`role_${i}`}
                        label="Role"
                        value={row.role}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, role: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Role --</option>
                        <option value="RN">RN</option>
                        <option value="LPN">LPN</option>
                        <option value="CNA">CNA</option>
                        <option value="Clerk">Clerk</option>
                      </Select>
                    </td>

                    {/* Required FTE */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`required_fte_${i}`}
                        label="Required FTE"
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.required_fte}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, required_fte: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-24"
                      />
                    </td>

                    {/* Notes */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`notes_${i}`}
                        label="Notes"
                        type="text"
                        value={row.notes || ""}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, notes: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Actions */}
                    <td className="border px-2 py-1 text-center space-x-2">
                      <Button
                        onClick={() => saveRow(row)}
                        variant="primary"
                        className="!px-2 !py-1 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => removeRow(row.id)}
                        variant="ghost"
                        className="!px-2 !py-1 text-xs text-red-600"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
