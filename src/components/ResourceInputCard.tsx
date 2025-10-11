import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

type ResourceRow = {
  id?: number
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
  const { state, data, updateData } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  // --------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------
  useEffect(() => {
    if (data.resourceInput.length > 0) {
      // Use context cache if already loaded
      setRows(data.resourceInput)
      setLoading(false)
    } else if (facilitySetup) {
      fetchResources()
    }
  }, [facilitySetup])

  const fetchResources = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      const url = `${baseURL}/resource-input.json`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load resource input")

      const json = await res.json()
      setRows(json)
      updateData("resourceInput", json) // ✅ store globally
    } catch (err: any) {
      console.error("Failed to load resource input", err)
      setError(err.message || "Failed to load resource input")
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------
  // SAVE + REMOVE HANDLERS (sync with context)
  // --------------------------------------------
  const saveRow = (row: ResourceRow) => {
    const updated = row.id
      ? rows.map((r) => (r.id === row.id ? row : r))
      : [...rows, { ...row, id: Date.now() }]
    setRows(updated)
    updateData("resourceInput", updated) // ✅ live sync
  }

  const removeRow = (id?: number) => {
    if (!id) return
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    updateData("resourceInput", updated) // ✅ live sync
  }

  // --------------------------------------------
  // RENDER
  // --------------------------------------------
  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Resource Input
        </h3>
        <Button
          onClick={() =>
            setRows((prev) => {
              const updated = [
                ...prev,
                {
                  first_name: "",
                  last_name: "",
                  position: "",
                  unit_fte: 1.0,
                  availability: "Day",
                  weekend_group: "",
                  vacancy_status: "Filled",
                  id: Date.now(),
                },
              ]
              updateData("resourceInput", updated)
              return updated
            })
          }
        >
          + Add Resource
        </Button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading resources...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No resources added yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    {/* First Name */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`first_name_${i}`}
                        label=""
                        value={row.first_name}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, first_name: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("resourceInput", updated)
                        }}
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Last Name */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`last_name_${i}`}
                        label=""
                        value={row.last_name}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, last_name: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("resourceInput", updated)
                        }}
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Position */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`position_${i}`}
                        label=""
                        value={row.position}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, position: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("resourceInput", updated)
                        }}
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
                        id={`unit_fte_${i}`}
                        label=""
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.unit_fte}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, unit_fte: Number(e.target.value) }
                              : r
                          )
                          setRows(updated)
                          updateData("resourceInput", updated)
                        }}
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Availability */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`availability_${i}`}
                        label=""
                        value={row.availability}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, availability: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("resourceInput", updated)
                        }}
                        className="!m-0 !p-1"
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                      </Select>
                    </td>

                    {/* Weekend Group */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`weekend_group_${i}`}
                        label=""
                        value={row.weekend_group}
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, weekend_group: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("resourceInput", updated)
                        }}
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
                        onChange={(e) => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, vacancy_status: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("resourceInput", updated)
                        }}
                        className="!m-0 !p-1"
                      >
                        <option value="Filled">Filled</option>
                        <option value="Vacant">Vacant</option>
                        <option value="Open Req">Open Req</option>
                      </Select>
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

      {/* Navigation Buttons */}
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
