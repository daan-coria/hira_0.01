import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import InfoButton from "@/components/ui/InfoButton"
import debounce from "lodash.debounce"

type PositionRow = {
  id?: number
  name: string
  category: string
}

type StaffingRow = {
  id?: number
  role: string
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

export default function PositionSetupPage({ onNext, onPrev }: Props) {
  const { state, data, updateData } = useApp()

  // -------------------------------
  // SECTION 1: POSITION SETUP
  // -------------------------------
  const [rows, setRows] = useState<PositionRow[]>([])
  const [categories, setCategories] = useState(["Nursing", "Support", "Other"])
  const [savingPos, setSavingPos] = useState(false)

  const debouncedSavePos = useCallback(
    debounce((updated: PositionRow[]) => {
      setSavingPos(true)
      updateData("positions", updated)
      setTimeout(() => setSavingPos(false), 400)
    }, 400),
    [updateData]
  )

  useEffect(() => {
    const initial =
      data.positions && Array.isArray(data.positions)
        ? data.positions
        : [
            { id: 1, name: "RN", category: "Nursing" },
            { id: 2, name: "LPN", category: "Nursing" },
            { id: 3, name: "CNA", category: "Support" },
            { id: 4, name: "Clerk", category: "Other" },
          ]
    setRows(initial)
  }, [data.positions])

  const handleChangePos = (index: number, key: keyof PositionRow, value: string) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    setRows(updated)
    debouncedSavePos(updated)
  }

  const addRowPos = () => {
    const newRow: PositionRow = { id: Date.now(), name: "", category: "" }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSavePos(updated)
  }

  const removeRowPos = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    debouncedSavePos(updated)
  }

  const addCategory = () => {
    const newCat = prompt("Enter new category name:")
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat])
    }
  }

  // -------------------------------
  // SECTION 2: STAFFING DETAILS
  // -------------------------------
  const [staffingRows, setStaffingRows] = useState<StaffingRow[]>([])
  const [savingStaff, setSavingStaff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseURL =
    import.meta.env.MODE === "development"
      ? `${window.location.origin}/mockdata`
      : "/api/v1"

  const debouncedSaveStaff = useCallback(
    debounce((updated: StaffingRow[]) => {
      setSavingStaff(true)
      updateData("staffingConfig", updated)
      setTimeout(() => setSavingStaff(false), 600)
    }, 600),
    [updateData]
  )

  useEffect(() => {
    const loadStaffing = async () => {
      try {
        setLoading(true)
        const url = `${baseURL}/staffing-config.json`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Missing staffing config")
        const data = await res.json()
        setStaffingRows(data)
        updateData("staffingConfig", data)
      } catch (err) {
        console.warn("⚠️ Using fallback staffing data", err)
        const fallback = [
          {
            id: 1,
            role: "RN",
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
        setStaffingRows(fallback as StaffingRow[])
        updateData("staffingConfig", fallback)
        setError("Loaded fallback staffing data.")
      } finally {
        setLoading(false)
      }
    }
    loadStaffing()
  }, [])

  const calcFTE = (row: StaffingRow): number => {
    const bedCount = state.facilitySetup?.bedCount || 0
    const ratio = typeof row.ratio === "number" ? row.ratio : 0
    const carePct = row.direct_care_percent / 100
    if (!ratio || ratio <= 0) return 0
    return parseFloat(((bedCount / ratio) * carePct).toFixed(2))
  }

  const handleChangeStaff = (i: number, field: keyof StaffingRow, value: any) => {
    const updated = staffingRows.map((r, idx) => {
      if (idx !== i) return r
      const newRow = { ...r, [field]: value }

      if (field === "type") {
        if (value === "Fixed") {
          newRow.ratio = "N/A"
          newRow.max_ratio = "N/A"
        } else if (value === "Variable") {
          newRow.ratio = 1
          newRow.max_ratio = 1
        }
      }

      if (newRow.type === "Variable") newRow.fte = calcFTE(newRow)
      if (["budgeted_fte", "filled_fte"].includes(field))
        newRow.open_fte = (newRow.budgeted_fte || 0) - (newRow.filled_fte || 0)

      return newRow
    })
    setStaffingRows(updated)
    debouncedSaveStaff(updated)
  }

  const addStaffRow = () => {
    const newRow: StaffingRow = {
      id: Date.now(),
      role: "",
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
    const updated = [...staffingRows, newRow]
    setStaffingRows(updated)
    debouncedSaveStaff(updated)
  }

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <Card className="p-6 space-y-6 rounded-xl shadow-sm">
      {/* Section 1: Position Setup */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Step 1.5 — Position & Staffing Setup
        </h3>
        <div className="flex items-center gap-3">
          {savingPos && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addCategory} variant="ghost">
            + Add Category
          </Button>
          <Button onClick={addRowPos}>+ Add Role</Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No roles defined yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-left">Role</th>
                <th className="px-3 py-2 border text-left">Category</th>
                <th className="px-3 py-2 border text-center w-32">Actions</th>
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
                      id={`pos_${i}`}
                      label=""
                      value={row.name}
                      placeholder="Enter Role"
                      onChange={(e) => handleChangePos(i, "name", e.target.value)}
                      className="!m-0 !p-1 w-full"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <Select
                      id={`cat_${i}`}
                      label=""
                      value={row.category}
                      onChange={(e) => handleChangePos(i, "category", e.target.value)}
                      className="!m-0 !p-1 w-full"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Button
                      onClick={() => removeRowPos(row.id)}
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

      {/* Divider Header */}
      <h4 className="text-md font-medium text-gray-600 mt-8 mb-2">
        Staffing Details
      </h4>

      {/* Section 2: Staffing Table */}
      {error && (
        <p className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded mb-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading staffing configuration...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm rounded-md">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 border">Role</th>
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
                <th className="px-3 py-2 border text-right">Budgeted FTE</th>
                <th className="px-3 py-2 border text-right">Filled FTE</th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end gap-1">
                    Open FTE
                    <InfoButton text="Difference between budgeted and filled FTE." />
                  </div>
                </th>
              </tr>
            </thead>

            {/* tbody reused from PositionStaffingSetupCard */}
            <tbody>
              {staffingRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-gray-500 bg-white">
                    No staffing details defined yet.
                  </td>
                </tr>
              ) : (
                staffingRows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors`}
                  >
                    {/* Role */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`staffrole_${i}`}
                        label=""
                        value={row.role}
                        onChange={(e) => handleChangeStaff(i, "role", e.target.value)}
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
                        onChange={(e) =>
                          handleChangeStaff(i, "type", e.target.value as any)
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
                        label=""
                        id={`ratio_${i}`}
                        type={row.type === "Fixed" ? "text" : "number"}
                        value={row.type === "Fixed" ? "N/A" : row.ratio}
                        disabled={row.type === "Fixed"}
                        placeholder="Ratio"
                        aria-label={`Ratio for ${row.role || "role"}`}
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed" ? "bg-gray-100 opacity-60" : ""
                        }`}
                        onChange={(e) =>
                          handleChangeStaff(i, "ratio", Number(e.target.value))
                        }
                      />
                    </td>

                    {/* Max Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`maxratio_${i}`}
                        type={row.type === "Fixed" ? "text" : "number"}
                        value={row.type === "Fixed" ? "N/A" : row.max_ratio}
                        disabled={row.type === "Fixed"}
                        placeholder="Max Ratio"
                        aria-label={`Max ratio for ${row.role || "role"}`}
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed" ? "bg-gray-100 opacity-60" : ""
                        }`}
                        onChange={(e) =>
                          handleChangeStaff(i, "max_ratio", Number(e.target.value))
                        }
                      />
                    </td>

                    {/* Direct Care % */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`dc_${i}`}
                        type="number"
                        min={0}
                        max={100}
                        value={row.direct_care_percent}
                        placeholder="Direct Care %"
                        aria-label={`Direct care percentage for ${row.role || "role"}`}
                        onChange={(e) =>
                          handleChangeStaff(
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
                      <input
                        type="checkbox"
                        id={`include_${i}`}
                        name={`include_${i}`}
                        checked={row.include_in_ratio}
                        onChange={(e) =>
                          handleChangeStaff(i, "include_in_ratio", e.target.checked)
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        title={`Include ${row.role || "role"} in ratio`}
                        aria-label={`Include ${row.role || "role"} in ratio`}
                      />
                    </td>

                    {/* FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`fte_${i}`}
                        type="number"
                        value={row.fte}
                        disabled={row.type === "Variable"}
                        placeholder="FTE"
                        aria-label={`FTE for ${row.role || "role"}`}
                        onChange={(e) =>
                          handleChangeStaff(i, "fte", Number(e.target.value))
                        }
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Variable" ? "bg-gray-100 opacity-60" : ""
                        }`}
                      />
                    </td>

                    {/* Budgeted FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`budgeted_${i}`}
                        type="number"
                        value={row.budgeted_fte}
                        placeholder="Budgeted FTE"
                        aria-label={`Budgeted FTE for ${row.role || "role"}`}
                        onChange={(e) =>
                          handleChangeStaff(i, "budgeted_fte", Number(e.target.value))
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Filled FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        label=""
                        id={`filled_${i}`}
                        type="number"
                        value={row.filled_fte}
                        placeholder="Filled FTE"
                        aria-label={`Filled FTE for ${row.role || "role"}`}
                        onChange={(e) =>
                          handleChangeStaff(i, "filled_fte", Number(e.target.value))
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        {savingStaff && <span className="text-sm text-gray-500">Saving staffing…</span>}
        <Button onClick={addStaffRow}>+ Add Staffing Row</Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onPrev}>
          ← Previous
        </Button>
        <Button variant="primary" onClick={onNext}>
          Continue →
        </Button>
      </div>
    </Card>
  )
}
