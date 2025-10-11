import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

type StaffingConfigRow = {
  id?: number
  role: string
  ratio_mode: "Ratio" | "Fixed"
  max_ratio: number
  include_in_ratio: boolean
  direct_care_percent: number
  category: string
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function StaffingConfigCard({ onNext, onPrev }: Props) {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<StaffingConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  useEffect(() => {
    if (facilitySetup) fetchConfigs()
  }, [facilitySetup])

  const fetchConfigs = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      const url = `${baseURL}/staffing-config.json`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load staffing configuration")

      const data = await res.json()
      setRows(data)
    } catch (err: any) {
      console.error("Failed to load staffing config", err)
      setError(err.message || "Failed to load staffing configuration")
    } finally {
      setLoading(false)
    }
  }

  const saveRow = (row: StaffingConfigRow) => {
    setRows((prev) =>
      row.id
        ? prev.map((r) => (r.id === row.id ? row : r))
        : [...prev, { ...row, id: Date.now() }]
    )
  }

  const removeRow = (id?: number) => {
    if (!id) return
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Staffing Configuration
        </h3>
        <Button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                role: "",
                ratio_mode: "Ratio",
                max_ratio: 0,
                include_in_ratio: true,
                direct_care_percent: 0,
                category: "",
              },
            ])
          }
        >
          + Add Config
        </Button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading staffing configuration...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Ratio Mode</th>
                <th className="px-3 py-2 border text-right">Max Ratio</th>
                <th className="px-3 py-2 border text-center">Include in Ratio</th>
                <th className="px-3 py-2 border text-right">Direct Care %</th>
                <th className="px-3 py-2 border">Category</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No staffing configs added yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    {/* Role */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`role_${i}`}
                        label=""
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

                    {/* Ratio Mode */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`ratio_mode_${i}`}
                        label=""
                        value={row.ratio_mode}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? {
                                    ...r,
                                    ratio_mode:
                                      e.target.value as "Ratio" | "Fixed",
                                  }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="Ratio">Ratio</option>
                        <option value="Fixed">Fixed</option>
                      </Select>
                    </td>

                    {/* Max Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`max_ratio_${i}`}
                        label=""
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.max_ratio}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, max_ratio: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Include in Ratio */}
                    <td className="border px-2 py-1 text-center">
                      <input
                        id={`include_${i}`}
                        type="checkbox"
                        checked={row.include_in_ratio}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, include_in_ratio: e.target.checked }
                                : r
                            )
                          )
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        aria-label={`Include ${row.role || "role"} in ratio`}  // ✅ Accessibility fix
                      />
                    </td>

                    {/* Direct Care % */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`direct_care_${i}`}
                        label=""
                        type="number"
                        min={0}
                        max={100}
                        value={row.direct_care_percent}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? {
                                    ...r,
                                    direct_care_percent: Number(e.target.value),
                                  }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Category */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`category_${i}`}
                        label=""
                        value={row.category}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, category: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Category --</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Support">Support</option>
                        <option value="Other">Other</option>
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
