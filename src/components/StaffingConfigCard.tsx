import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"

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
  const { updateData } = useApp()
  const [rows, setRows] = useState<StaffingConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ✅ Ensure leading slash for absolute path
  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  // ✅ Fallback data in case mock file is missing
  const fallbackData: StaffingConfigRow[] = [
    { id: 1, role: "RN", ratio_mode: "Ratio", max_ratio: 4, include_in_ratio: true, direct_care_percent: 100, category: "Nursing" },
    { id: 2, role: "LPN", ratio_mode: "Ratio", max_ratio: 6, include_in_ratio: true, direct_care_percent: 80, category: "Nursing" },
    { id: 3, role: "CNA", ratio_mode: "Ratio", max_ratio: 8, include_in_ratio: true, direct_care_percent: 90, category: "Support" },
    { id: 4, role: "Clerk", ratio_mode: "Fixed", max_ratio: 1, include_in_ratio: false, direct_care_percent: 0, category: "Other" }
  ]

  // ✅ Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: StaffingConfigRow[]) => {
      setSaving(true)
      updateData("staffingConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    []
  )

  useEffect(() => {
    fetchConfigs()
  }, [])

  // ✅ Safe fetch with fallback logic
  const fetchConfigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = `${baseURL}/staffing-config.json` // absolute root path
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
    const updated = rows.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: StaffingConfigRow = {
      id: Date.now(),
      role: "",
      ratio_mode: "Ratio",
      max_ratio: 0,
      include_in_ratio: true,
      direct_care_percent: 0,
      category: "",
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Staffing Configuration
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addRow}>+ Add Config</Button>
        </div>
      </div>

      {error && (
        <p className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded">
          {error}
        </p>
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

                {/* Max Ratio with tooltip */}
                <th
                  className="px-3 py-2 border text-right cursor-help relative group"
                  title="Max Ratio: Maximum number of patients one staff member can care for (e.g., 1:6 means one RN per six patients)."
                >
                  Max Ratio
                  <span className="ml-1 text-gray-400 group-hover:text-gray-600">ℹ️</span>
                </th>

                {/* Regular Ratio with tooltip */}
                <th
                  className="px-3 py-2 border text-center cursor-help relative group"
                  title="Regular Ratio: Readable display of the staff-to-patient ratio (1 : Max Ratio)."
                >
                  Regular Ratio
                  <span className="ml-1 text-gray-400 group-hover:text-gray-600">ℹ️</span>
                </th>

                <th className="px-3 py-2 border text-center">Include in Ratio</th>
                <th className="px-3 py-2 border text-right">Direct Care %</th>
                <th className="px-3 py-2 border">Category</th>
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
                          handleChange(i, "role", e.target.value)
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
                          handleChange(
                            i,
                            "ratio_mode",
                            e.target.value as "Ratio" | "Fixed"
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
                          handleChange(i, "max_ratio", Number(e.target.value))
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Regular Ratio */}
                    <td className="border px-2 py-1 text-center text-gray-700 font-medium">
                      {row.ratio_mode === "Ratio"
                        ? `1 : ${row.max_ratio || 0}`
                        : "N/A"}
                    </td>

                    {/* Include in Ratio */}
                    <td className="border px-2 py-1 text-center">
                      <input
                        id={`include_${i}`}
                        type="checkbox"
                        checked={row.include_in_ratio}
                        onChange={(e) =>
                          handleChange(i, "include_in_ratio", e.target.checked)
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        aria-label={`Include ${row.role || "role"} in ratio`}
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
                          handleChange(
                            i,
                            "direct_care_percent",
                            Number(e.target.value)
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
                          handleChange(i, "category", e.target.value)
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Category --</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Support">Support</option>
                        <option value="Other">Other</option>
                      </Select>
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
