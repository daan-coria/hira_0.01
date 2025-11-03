import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import { toast } from "react-hot-toast"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"

type Row = {
  id?: number
  role: string
  category: string
  type: "Variable" | "Fixed"
  ratio: number | string
  max_ratio: number | string
  include_in_ratio: boolean
  direct_care_percent: number
  total_hours_per_week: number | string
  weekend_rotation: string | number | ""
  fte: number | string
  budgeted_fte: number
  filled_fte: number
  open_fte: number
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function PositionStaffingSetupCard({ onNext, onPrev }: Props) {
  const { state, updateData } = useApp()
  const [rows, setRows] = useState<Row[]>([])
  const [categories, setCategories] = useState<string[]>(
    state.facilitySetup?.categories || ["Nursing", "Support", "Other"]
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseURL = `${window.location.origin}/mockdata`

  // ✅ Fallback dataset
  const fallbackData: Row[] = [
    {
      id: 1,
      role: "RN",
      category: "Nursing",
      type: "Variable",
      ratio: 4,
      max_ratio: 5,
      include_in_ratio: true,
      direct_care_percent: 100,
      fte: "N/A",
      budgeted_fte: 10,
      filled_fte: 8,
      open_fte: 2,
      total_hours_per_week: 40,
      weekend_rotation: 1,
    },
    {
      id: 2,
      role: "LPN",
      category: "Nursing",
      type: "Variable",
      ratio: 6,
      max_ratio: 8,
      include_in_ratio: true,
      direct_care_percent: 80,
      fte: "N/A",
      budgeted_fte: 6,
      filled_fte: 5,
      open_fte: 1,
      total_hours_per_week: 40,
      weekend_rotation: 2,
    },
    {
      id: 3,
      role: "CNA",
      category: "Support",
      type: "Variable",
      ratio: 8,
      max_ratio: 10,
      include_in_ratio: true,
      direct_care_percent: 90,
      fte: "N/A",
      budgeted_fte: 12,
      filled_fte: 11,
      open_fte: 1,
      total_hours_per_week: 40,
      weekend_rotation: 3,
    },
    {
      id: 4,
      role: "Clerk",
      category: "Other",
      type: "Fixed",
      ratio: "N/A",
      max_ratio: "N/A",
      include_in_ratio: false,
      direct_care_percent: 0,
      fte: 1,
      budgeted_fte: 1,
      filled_fte: 1,
      open_fte: 0,
      total_hours_per_week: 40,
      weekend_rotation: "",
    },
  ]

  // ✅ Debounced save
  const debouncedSave = useCallback(
    debounce((updated: Row[]) => {
      setSaving(true)
      updateData("staffingConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 600),
    [updateData]
  )

  // ✅ Normalize legacy text values (for backward compatibility)
  // Use a hoisted function declaration so the loader can call it without temporal-dead-zone issues
  function normalizeWeekend(val: any): string | number | "" {
    if (!val) return ""
    const text = val.toString().toLowerCase()
    if (["1", "a", "every weekend"].includes(text)) return 1
    if (["2", "b", "every other weekend"].includes(text)) return 2
    if (["3", "c", "every third weekend"].includes(text)) return 3
    if (["rotate", "wc"].some((k) => text.includes(k))) return ""
    return ""
  }

  // ✅ Load mock data or fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${baseURL}/staffing-config.json`)
        if (!res.ok) throw new Error("Missing staffing config, using fallback")
        const data = await res.json()
        const normalized = data.map((r: Row) => ({
          ...r,
          weekend_rotation: normalizeWeekend(r.weekend_rotation),
        }))
        setRows(normalized)
        updateData("staffingConfig", normalized)
      } catch {
        console.warn("⚠️ Using fallback data")
        setRows(fallbackData)
        updateData("staffingConfig", fallbackData)
        setError("Loaded fallback data.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  

  // ✅ FTE calculation
  const calcFTE = (row: Row): number => {
    const bedCount = state.facilitySetup?.bedCount || 0
    const ratio = typeof row.ratio === "number" ? row.ratio : 0
    const carePct = row.direct_care_percent / 100
    if (!ratio || ratio <= 0) return 0
    return parseFloat(((bedCount / ratio) * carePct).toFixed(2))
  }

  // ✅ Handle changes
  const handleChange = (i: number, field: keyof Row, value: any) => {
    const updated = rows.map((r, idx) => {
      if (idx !== i) return r
      const newRow = { ...r, [field]: value }

      if (field === "type") {
        if (value === "Fixed") {
          newRow.ratio = "N/A"
          newRow.max_ratio = "N/A"
          newRow.fte = 1
        } else {
          newRow.ratio = 1
          newRow.max_ratio = 1
          newRow.fte = "N/A"
        }
      }

      if (newRow.type === "Variable") newRow.fte = calcFTE(newRow)

      if (["budgeted_fte", "filled_fte"].includes(field))
        newRow.open_fte =
          (newRow.budgeted_fte || 0) - (newRow.filled_fte || 0)

      return newRow
    })
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: Row = {
      id: Date.now(),
      role: "",
      category: "",
      type: "Variable",
      ratio: 1,
      max_ratio: 1,
      include_in_ratio: true,
      direct_care_percent: 100,
      total_hours_per_week: 40,
      weekend_rotation: "",
      fte: "N/A",
      budgeted_fte: 0,
      filled_fte: 0,
      open_fte: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  const handleCategoryChange = (i: number, value: string) => {
    if (value === "__add_custom__") {
      const newCat = prompt("Enter new category name:")
      if (newCat && !categories.includes(newCat)) {
        const updatedCats = [...categories, newCat]
        setCategories(updatedCats)
        handleChange(i, "category", newCat)
      }
    } else handleChange(i, "category", value)
  }

  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    debouncedSave(updated)
  }

  const clearAll = () => {
    if (!window.confirm("Reset all roles to default?")) return
    setRows(fallbackData)
    updateData("staffingConfig", fallbackData)
  }

  return (
    <Card className="p-5 rounded-xl shadow-sm divide-y divide-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Position & Staffing Setup
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button
            variant="ghost"
            onClick={clearAll}
            className="text-sm text-red-600 border border-red-300 hover:bg-red-50"
          >
            Clear All
          </Button>
          <Button onClick={addRow}>+ Add Role</Button>
        </div>
      </div>

      {error && (
        <p className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded mb-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading configuration...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-md">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Category</th>
                <th className="px-3 py-2 border">Type</th>
                <th className="px-3 py-2 border text-right">Ratio</th>
                <th className="px-3 py-2 border text-right">Max Ratio</th>
                <th className="px-3 py-2 border text-right">Direct Care %</th>
                <th className="px-3 py-2 border text-center">Include</th>
                <th className="px-3 py-2 border text-right">Hours/Week</th>
                <th className="px-3 py-2 border text-right">Weekend Rotation</th>
                <th className="px-3 py-2 border text-right">FTE</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                >
                  <td className="border px-2 py-1">
                    <Input
                      id={`role_${i}`}
                      value={row.role}
                      onChange={(e) => handleChange(i, "role", e.target.value)}
                      className="!m-0 !p-1 w-full"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <Select
                      id={`cat_${i}`}
                      value={row.category}
                      onChange={(e) => handleCategoryChange(i, e.target.value)}
                      className="!m-0 !p-1 w-full"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__add_custom__">+ Add Custom Category…</option>
                    </Select>
                  </td>
                  <td className="border px-2 py-1">
                    <Select
                      id={`type_${i}`}
                      value={row.type}
                      onChange={(e) =>
                        handleChange(i, "type", e.target.value as any)
                      }
                      className="!m-0 !p-1"
                    >
                      <option value="Variable">Variable</option>
                      <option value="Fixed">Fixed</option>
                    </Select>
                  </td>
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`ratio_${i}`}
                      type={row.type === "Fixed" ? "text" : "number"}
                      value={row.type === "Fixed" ? "N/A" : row.ratio}
                      disabled={row.type === "Fixed"}
                      onChange={(e) => handleChange(i, "ratio", Number(e.target.value))}
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`maxratio_${i}`}
                      type={row.type === "Fixed" ? "text" : "number"}
                      value={row.type === "Fixed" ? "N/A" : row.max_ratio}
                      disabled={row.type === "Fixed"}
                      onChange={(e) => handleChange(i, "max_ratio", Number(e.target.value))}
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`dc_${i}`}
                      type="number"
                      value={row.direct_care_percent}
                      onChange={(e) =>
                        handleChange(i, "direct_care_percent", Number(e.target.value))
                      }
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      id={`include_${i}`}
                      type="checkbox"
                      title={`Include ${row.role || "role " + (i + 1)} in ratio`}
                      aria-label={`Include ${row.role || "role " + (i + 1)} in ratio`}
                      checked={row.include_in_ratio}
                      onChange={(e) =>
                        handleChange(i, "include_in_ratio", e.target.checked)
                      }
                      className="h-4 w-4 text-green-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`hours_${i}`}
                      type="number"
                      min={1}
                      max={168}
                      value={row.total_hours_per_week}
                      onChange={(e) =>
                        handleChange(i, "total_hours_per_week", Number(e.target.value))
                      }
                      className="!m-0 !p-1 w-20 text-right"
                    />
                  </td>

                  {/* ✅ Weekend rotation (numbers only) */}
                  <td className="border px-2 py-1 text-right">
                    <Select
                      id={`weekend_${i}`}
                      value={row.weekend_rotation}
                      onChange={(e) =>
                        handleChange(i, "weekend_rotation", e.target.value)
                      }
                      className="!m-0 !p-1 w-20 text-right"
                    >
                      <option value="">--</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="Rotate">Rotate</option>
                    </Select>
                  </td>

                  <td className="border px-2 py-1 text-right">
                    {row.type === "Variable" ? (
                      <div className="text-gray-400 text-center">N/A</div>
                    ) : (
                      <Input
                        id={`fte_${i}`}
                        type="number"
                        value={row.fte}
                        onChange={(e) => handleChange(i, "fte", Number(e.target.value))}
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    )}
                  </td>

                  <td className="border px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-red-600 hover:bg-red-50"
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
