import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import InfoButton from "@/components/ui/InfoButton"
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
  fte: number
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
      fte: 10,
      budgeted_fte: 10,
      filled_fte: 8,
      open_fte: 2,
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
      fte: 7,
      budgeted_fte: 6,
      filled_fte: 5,
      open_fte: 1,
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
      fte: 12,
      budgeted_fte: 12,
      filled_fte: 11,
      open_fte: 1,
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

  // ✅ Load mock data or fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const url = `${baseURL}/staffing-config.json`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Missing staffing config, using fallback")
        const data = await res.json()
        setRows(data)
        updateData("staffingConfig", data)
      } catch (err) {
        console.warn("⚠️ Using fallback data", err)
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
        } else {
          newRow.ratio = 1
          newRow.max_ratio = 1
        }
      }

      if (newRow.type === "Variable") newRow.fte = calcFTE(newRow)
      if (["budgeted_fte", "filled_fte"].includes(field))
        newRow.open_fte = (newRow.budgeted_fte || 0) - (newRow.filled_fte || 0)

      return newRow
    })
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Add new row
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
      fte: 0,
      budgeted_fte: 0,
      filled_fte: 0,
      open_fte: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Add or create custom category
  const handleCategoryChange = (i: number, value: string) => {
    if (value === "__add_custom__") {
      const newCat = prompt("Enter new category name:")
      if (newCat && !categories.includes(newCat)) {
        const updatedCats = [...categories, newCat]
        setCategories(updatedCats)
        updateData("positions", [
          ...(rows.map((r) => ({ name: r.role, category: r.category })) || []),
          { name: "", category: newCat },
        ])
        handleChange(i, "category", newCat)
      }
    } else {
      handleChange(i, "category", value)
    }
  }

  // ✅ Remove single row
  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    debouncedSave(updated)
  }

  // ✅ Clear all and reset to fallback
  const clearAll = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all roles to default?"
    )
    if (!confirmReset) return
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
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    Ratio
                    <InfoButton text="Editable ratio used in calculations (only for Variable roles)." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    Max Ratio
                    <InfoButton text="Maximum allowable ratio per staff." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-right">Direct Care %</th>
                <th className="px-3 py-2 border text-center">Include</th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    FTE
                    <InfoButton text="Auto-calculated based on ratio and bed count." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    Budgeted FTE
                    <InfoButton text="Approved staffing positions for this role (from finance)." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    Filled FTE
                    <InfoButton text="Current filled positions (from HR)." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    Open FTE
                    <InfoButton text="Difference between budgeted and filled FTE." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="text-center py-4 text-gray-500 bg-white"
                  >
                    No roles defined yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors`}
                  >
                    {/* Role */}
                    <td className="border px-2 py-1">
                      <Input
                        label=""
                        id={`role_${i}`}
                        value={row.role}
                        onChange={(e) =>
                          handleChange(i, "role", e.target.value)
                        }
                        className="!m-0 !p-1 w-full"
                      />
                    </td>

                    {/* Category */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`cat_${i}`}
                        label=""
                        value={row.category}
                        onChange={(e) =>
                          handleCategoryChange(i, e.target.value)
                        }
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

                    {/* Type */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`type_${i}`}
                        label=""
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

                    {/* Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`ratio_${i}`}
                        type={row.type === "Fixed" ? "text" : "number"}
                        value={row.type === "Fixed" ? "N/A" : row.ratio}
                        disabled={row.type === "Fixed"}
                        onChange={(e) =>
                          handleChange(i, "ratio", Number(e.target.value))
                        }
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed"
                            ? "bg-gray-100 opacity-60"
                            : ""
                        }`}
                      />
                    </td>

                    {/* Max Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`maxratio_${i}`}
                        type={row.type === "Fixed" ? "text" : "number"}
                        value={row.type === "Fixed" ? "N/A" : row.max_ratio}
                        disabled={row.type === "Fixed"}
                        onChange={(e) =>
                          handleChange(i, "max_ratio", Number(e.target.value))
                        }
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed"
                            ? "bg-gray-100 opacity-60"
                            : ""
                        }`}
                      />
                    </td>

                    {/* Direct Care % */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`dc_${i}`}
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

                    {/* Include */}
                    <td className="border px-2 py-1 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          id={`include_${i}`}
                          checked={row.include_in_ratio}
                          onChange={(e) =>
                            handleChange(i, "include_in_ratio", e.target.checked)
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          aria-label={`Include ${row.role} in ratio calculations`}
                        />
                      </div>
                    </td>

                    {/* FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`fte_${i}`}
                        type="number"
                        value={row.fte}
                        disabled={row.type === "Variable"}
                        onChange={(e) =>
                          handleChange(i, "fte", Number(e.target.value))
                        }
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Variable"
                            ? "bg-gray-100 opacity-60"
                            : ""
                        }`}
                      />
                    </td>

                    {/* Budgeted FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`budgeted_${i}`}
                        type="number"
                        value={row.budgeted_fte}
                        onChange={(e) =>
                          handleChange(
                            i,
                            "budgeted_fte",
                            Number(e.target.value)
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Filled FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`filled_${i}`}
                        type="number"
                        value={row.filled_fte}
                        onChange={(e) =>
                          handleChange(i, "filled_fte", Number(e.target.value))
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Open FTE */}
                    <td
                      className={`border px-2 py-1 text-right font-semibold ${
                        (row.open_fte ?? 0) > 0
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {(row.open_fte ?? 0).toFixed(1)}
                    </td>

                    {/* Actions */}
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
