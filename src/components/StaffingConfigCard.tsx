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
  type: "Variable" | "Fixed"
  ratio: number | string
  max_ratio: number | string
  include_in_ratio: boolean
  direct_care_percent: number
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

  // ✅ Debounced auto-save
  const debouncedSave = useCallback(
    debounce((updated: StaffingConfigRow[]) => {
      setSaving(true)
      // 👉 Only store role + type mapping globally for Step 4 filtering
      updateData(
        "staffingConfig",
        updated.map((r) => ({
          role: r.role,
          type: r.type,
        }))
      )
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
      const url = `${baseURL}/staffing-config.json`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Missing config file")
      const data = await res.json()
      setRows(data)
      updateData(
        "staffingConfig",
        data.map((r: StaffingConfigRow) => ({
          role: r.role,
          type: r.type,
        }))
      )
    } catch (err: any) {
      console.warn("⚠️ Using fallback staffing config", err)
      setRows(fallbackData)
      updateData(
        "staffingConfig",
        fallbackData.map((r) => ({
          role: r.role,
          type: r.type,
        }))
      )
      setError("Loaded fallback staffing configuration.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fallback data
  const fallbackData: StaffingConfigRow[] = [
    {
      id: 1,
      role: "RN",
      type: "Variable",
      ratio: 4,
      max_ratio: 5,
      include_in_ratio: true,
      direct_care_percent: 100,
      fte: 10,
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
    },
  ]

  // 🧮 Auto-calculate FTE dynamically
  const calculateFTE = (row: StaffingConfigRow): number => {
    const bedCount = state.facilitySetup?.bedCount || 0
    const ratio = typeof row.ratio === "number" ? row.ratio : 0
    const carePct = row.direct_care_percent / 100
    if (!ratio || ratio <= 0) return 0
    return parseFloat(((bedCount / ratio) * carePct).toFixed(2))
  }

  const handleChange = (index: number, field: keyof StaffingConfigRow, value: any) => {
    const updated = rows.map((r, i) => {
      if (i !== index) return r
      const newRow = { ...r, [field]: value }

      // Auto behavior by type
      if (field === "type") {
        if (value === "Fixed") {
          newRow.ratio = "N/A"
          newRow.max_ratio = "N/A"
        } else if (value === "Variable") {
          newRow.ratio = 1
          newRow.max_ratio = 1
        }
      }

      // Auto FTE recalculation
      if (newRow.type === "Variable") newRow.fte = calculateFTE(newRow)
      return newRow
    })

    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: StaffingConfigRow = {
      id: Date.now(),
      role: "",
      type: "Variable",
      ratio: 1,
      max_ratio: 1,
      include_in_ratio: true,
      direct_care_percent: 0,
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

      {error && (
        <p className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded">{error}</p>
      )}

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
                    Ratio
                    <InfoButton text="Editable ratio (only for Variable roles)." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-right">
                  <div className="flex items-center justify-end">
                    Max Ratio
                    <InfoButton text="Maximum allowable ratio per staff." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-right">FTE</th>
                <th className="px-3 py-2 border text-center">Include</th>
                <th className="px-3 py-2 border text-right">Direct Care %</th>
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
                        label={`Role ${i + 1}`}
                        id={`role_${i}`}
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

                    <td className="border px-2 py-1">
                      <Select
                        label={`Type ${i + 1}`}
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

                    {/* Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`ratio_${i}`}
                        type={row.type === "Fixed" ? "text" : "number"}
                        value={row.type === "Fixed" ? "N/A" : row.ratio}
                        disabled={row.type === "Fixed"}
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed" ? "bg-gray-100 opacity-60" : ""
                        }`}
                        onChange={(e) =>
                          handleChange(i, "ratio", Number(e.target.value))
                        }
                      />
                    </td>

                    {/* Max Ratio */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`max_ratio_${i}`}
                        type={row.type === "Fixed" ? "text" : "number"}
                        value={row.type === "Fixed" ? "N/A" : row.max_ratio}
                        disabled={row.type === "Fixed"}
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Fixed" ? "bg-gray-100 opacity-60" : ""
                        }`}
                        onChange={(e) =>
                          handleChange(i, "max_ratio", Number(e.target.value))
                        }
                      />
                    </td>

                    {/* FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`fte_${i}`}
                        type="number"
                        value={row.fte}
                        disabled={row.type === "Variable"}
                        className={`!m-0 !p-1 w-20 text-right ${
                          row.type === "Variable"
                            ? "bg-gray-100 opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                        onChange={(e) =>
                          handleChange(i, "fte", Number(e.target.value))
                        }
                      />
                    </td>

                    {/* Include */}
                    <td className="border px-2 py-1 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.include_in_ratio}
                          onChange={(e) =>
                            handleChange(i, "include_in_ratio", e.target.checked)
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          aria-label={`Include ${(row.role || `role ${i + 1}`)} in ratio`}
                          title={`Include ${(row.role || `role ${i + 1}`)} in ratio`}
                          placeholder=""
                        />
                        <span className="sr-only">Include {(row.role || `role ${i + 1}`)} in ratio</span>
                      </label>
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

/*
🔗 Integration Note:
Step 4 (ResourceInputCard) filters shift availability based on `role` and `type`.
This component now ensures each saved row in `staffingConfig`
includes at least { role, type } for downstream constraint logic.
*/
