import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import InfoButton from "@/components/ui/InfoButton"
import debounce from "lodash.debounce"

type StaffingConfigRow = {
  id?: number
  role: string
  type: "Ratio-Based" | "Fixed Position"
  regular_ratio: number | string
  max_ratio: number | string
  include_in_ratio: boolean
  direct_care_percent: number
  category: string
  fte: number
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function StaffingConfigCard({ onNext, onPrev }: Props) {
  const { updateData, state } = useApp()
  const [rows, setRows] = useState<StaffingConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const baseURL = import.meta.env.MODE === "development" ? "/mockdata" : "/api"
  const categories = state.facilitySetup?.categories || ["Nursing", "Support", "Other"]

  const fallbackData: StaffingConfigRow[] = [
    {
      id: 1,
      role: "RN",
      type: "Ratio-Based",
      regular_ratio: 4,
      max_ratio: 5,
      include_in_ratio: true,
      direct_care_percent: 100,
      category: "Nursing",
      fte: 10,
    },
    {
      id: 2,
      role: "LPN",
      type: "Ratio-Based",
      regular_ratio: 6,
      max_ratio: 8,
      include_in_ratio: true,
      direct_care_percent: 80,
      category: "Nursing",
      fte: 7,
    },
    {
      id: 3,
      role: "CNA",
      type: "Ratio-Based",
      regular_ratio: 8,
      max_ratio: 10,
      include_in_ratio: true,
      direct_care_percent: 90,
      category: "Support",
      fte: 12,
    },
    {
      id: 4,
      role: "Clerk",
      type: "Fixed Position",
      regular_ratio: "N/A",
      max_ratio: "N/A",
      include_in_ratio: false,
      direct_care_percent: 0,
      category: "Other",
      fte: 1,
    },
  ]

  const debouncedSave = useCallback(
    debounce((updated: StaffingConfigRow[]) => {
      setSaving(true)
      updateData("staffingConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = `${baseURL}/staffing-config.json`
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`⚠️ ${url} not found, using fallback data.`)
        setRows(fallbackData)
        updateData("staffingConfig", fallbackData)
        return
      }
      const data = await res.json()
      setRows(data)
      updateData("staffingConfig", data)
    } catch (err: any) {
      console.error("⚠️ Failed to fetch staffing config, using fallback", err)
      setRows(fallbackData)
      updateData("staffingConfig", fallbackData)
      setError("Loaded fallback staffing configuration.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (index: number, field: keyof StaffingConfigRow, value: any) => {
    const updated = rows.map((r, i) => {
      if (i !== index) return r
      const newRow = { ...r, [field]: value }

      // Auto behavior for Fixed Position
      if (field === "type") {
        if (value === "Fixed Position") {
          newRow.max_ratio = "N/A"
          newRow.regular_ratio = "N/A"
        } else if (value === "Ratio-Based") {
          newRow.max_ratio = 1
          newRow.regular_ratio = 1
        }
      }

      // Validation: Regular Ratio ≤ Max Ratio
      if (
        field === "regular_ratio" &&
        typeof newRow.max_ratio === "number" &&
        Number(value) > newRow.max_ratio
      ) {
        alert("⚠️ Regular Ratio cannot exceed Max Ratio.")
        newRow.regular_ratio = newRow.max_ratio
      }

      return newRow
    })

    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: StaffingConfigRow = {
      id: Date.now(),
      role: "",
      type: "Ratio-Based",
      regular_ratio: 1,
      max_ratio: 1,
      include_in_ratio: true,
      direct_care_percent: 0,
      category: categories[0] || "",
      fte: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Staffing Configuration</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addRow}>+ Add Config</Button>
        </div>
      </div>

      {error && <p className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading staffing configuration...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Type</th>

                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end">
                    Max Ratio
                    <InfoButton text="Maximum number of patients per staff (e.g., 1:6 means one RN per six patients)." />
                  </div>
                </th>

                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end">
                    Regular Ratio
                    <InfoButton text="Editable ratio used in calculations. Must not exceed Max Ratio." />
                  </div>
                </th>

                <th className="px-3 py-2 border text-center">Include in Ratio</th>
                <th className="px-3 py-2 border text-right">Direct Care %</th>
                <th className="px-3 py-2 border">Category</th>
                <th className="px-3 py-2 border text-right">FTE</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
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
                        onChange={(e) => handleChange(i, "role", e.target.value)}
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Role --</option>
                        <option value="RN">RN</option>
                        <option value="LPN">LPN</option>
                        <option value="CNA">CNA</option>
                        <option value="Clerk">Clerk</option>
                      </Select>
                    </td>

                    {/* Type */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`type_${i}`}
                        label=""
                        value={row.type}
                        onChange={(e) => handleChange(i, "type", e.target.value as any)}
                        className="!m-0 !p-1"
                      >
                        <option value="Ratio-Based">Ratio-Based</option>
                        <option value="Fixed Position">Fixed Position</option>
                      </Select>
                    </td>

                    {/* Max Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`max_ratio_${i}`}
                        type={row.type === "Fixed Position" ? "text" : "number"}
                        value={row.type === "Fixed Position" ? "N/A" : row.max_ratio}
                        disabled={row.type === "Fixed Position"}
                        onChange={(e) => handleChange(i, "max_ratio", Number(e.target.value))}
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed Position" ? "bg-gray-100 opacity-60" : ""
                        }`}
                      />
                    </td>

                    {/* Regular Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`regular_ratio_${i}`}
                        type={row.type === "Fixed Position" ? "text" : "number"}
                        value={row.type === "Fixed Position" ? "N/A" : row.regular_ratio}
                        disabled={row.type === "Fixed Position"}
                        onChange={(e) =>
                          handleChange(i, "regular_ratio", Number(e.target.value))
                        }
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed Position" ? "bg-gray-100 opacity-60" : ""
                        }`}
                      />
                    </td>

                    {/* Include in Ratio */}
                    <td className="border px-2 py-1 text-center">
                      <input
                        id={`include_${i}`}
                        type="checkbox"
                        checked={row.include_in_ratio}
                        onChange={(e) => handleChange(i, "include_in_ratio", e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        aria-label={`Include ${row.role || "role"} in ratio`}
                        title={`Include ${row.role || "role"} in ratio`}
                        placeholder="Include in ratio"
                      />
                    </td>

                    {/* Direct Care % */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`direct_care_${i}`}
                        type="number"
                        min={0}
                        max={100}
                        value={row.direct_care_percent}
                        onChange={(e) =>
                          handleChange(i, "direct_care_percent", Number(e.target.value))
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
                        onChange={(e) => handleChange(i, "category", e.target.value)}
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Select>
                    </td>

                    {/* FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`fte_${i}`}
                        type="number"
                        value={row.fte}
                        disabled
                        className="!m-0 !p-1 w-20 text-right bg-gray-100 opacity-60 cursor-not-allowed"
                      />
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
