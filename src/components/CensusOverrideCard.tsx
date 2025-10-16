import { useEffect, useState, useCallback, useMemo } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"

type CensusOverrideRow = {
  id?: number
  date: string
  shift: "Day" | "Night" | ""
  systemCensus: number
  overrideCensus: number
  reason?: string
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<CensusOverrideRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overrideEnabled, setOverrideEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  // --- Debounced save handler ---
  const debouncedSave = useCallback(
    debounce((updated: CensusOverrideRow[]) => {
      setSaving(true)
      updateData("censusOverride", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    []
  )

  // --- Load data ---
  useEffect(() => {
    if (data.censusOverride.length > 0) {
      setRows(data.censusOverride)
      setLoading(false)
    } else {
      fetchCensusOverrides()
    }
  }, [])

  const fetchCensusOverrides = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = `${baseURL}/census-override.json`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load census override data")
      const json = await res.json()

      const enriched = json.map((row: any, i: number) => ({
        id: row.id || Date.now() + i,
        date: row.date || "",
        shift: row.shift || "Day",
        systemCensus: row.systemCensus ?? Math.floor(Math.random() * 50) + 20,
        overrideCensus: row.overrideCensus ?? row.systemCensus ?? 0,
        reason: row.reason || "",
      }))

      setRows(enriched)
      updateData("censusOverride", enriched)
    } catch (err: any) {
      console.error("Failed to load census override", err)
      setError(err.message || "Failed to load census override")
    } finally {
      setLoading(false)
    }
  }

  // --- Add Row ---
  const addRow = () => {
    const newRow: CensusOverrideRow = {
      id: Date.now(),
      date: "",
      shift: "Day",
      systemCensus: Math.floor(Math.random() * 50) + 20,
      overrideCensus: 0,
      reason: "",
    }
    const updated = [...rows, newRow]
    setRows(updated)
    updateData("censusOverride", updated)
  }

  // --- Handle Field Changes ---
  const handleChange = (
    index: number,
    field: keyof CensusOverrideRow,
    value: any
  ) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  // --- Toggle Override Mode ---
  const handleToggle = () => setOverrideEnabled((prev) => !prev)

  // --- Check if row is overridden ---
  const isOverridden = (r: CensusOverrideRow) =>
    r.overrideCensus !== r.systemCensus

  // --- Summary calculations ---
  const summary = useMemo(() => {
    const totalSystem = rows.reduce((acc, r) => acc + (r.systemCensus || 0), 0)
    const totalOverride = rows.reduce((acc, r) => acc + (r.overrideCensus || 0), 0)
    const diff = totalOverride - totalSystem
    const percentChange = totalSystem
      ? ((diff / totalSystem) * 100).toFixed(1)
      : "0"
    return { totalSystem, totalOverride, diff, percentChange }
  }, [rows])

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Census Override
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={overrideEnabled}
              onChange={handleToggle}
              className="w-4 h-4 accent-green-600"
            />
            Enable Override Mode
          </label>
          <Button onClick={addRow} disabled={!overrideEnabled}>
            + Add Record
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded">{error}</p>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading census override data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Date</th>
                <th className="px-3 py-2 border">Shift</th>
                <th className="px-3 py-2 border text-right">System Census</th>
                <th className="px-3 py-2 border text-right">Override Census</th>
                <th className="px-3 py-2 border">Reason</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No census override data yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    className={`transition ${
                      overrideEnabled
                        ? isOverridden(row)
                          ? "bg-yellow-50"
                          : "bg-white"
                        : "bg-gray-100 opacity-60"
                    }`}
                  >
                    {/* Date */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`date_${i}`}
                        label=""
                        type="date"
                        value={row.date}
                        disabled={!overrideEnabled}
                        onChange={(e) =>
                          handleChange(i, "date", e.target.value)
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Shift */}
                    <td className="border px-2 py-1 text-center">
                      <Select
                        id={`shift_${i}`}
                        label=""
                        value={row.shift}
                        disabled={!overrideEnabled}
                        onChange={(e) =>
                          handleChange(i, "shift", e.target.value)
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                      </Select>
                    </td>

                    {/* System Census */}
                    <td className="border px-2 py-1 text-right text-gray-600 font-medium">
                      {row.systemCensus ?? "-"}
                    </td>

                    {/* Override Census */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`override_${i}`}
                        label=""
                        type="number"
                        min="0"
                        value={row.overrideCensus}
                        disabled={!overrideEnabled}
                        onChange={(e) =>
                          handleChange(
                            i,
                            "overrideCensus",
                            Number(e.target.value)
                          )
                        }
                        className={`!m-0 !p-1 w-20 text-right ${
                          isOverridden(row)
                            ? "border-yellow-400 bg-yellow-50"
                            : ""
                        }`}
                      />
                    </td>

                    {/* Reason */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`reason_${i}`}
                        label=""
                        type="text"
                        placeholder="Optional reason"
                        value={row.reason || ""}
                        disabled={!overrideEnabled}
                        onChange={(e) =>
                          handleChange(i, "reason", e.target.value)
                        }
                        className="!m-0 !p-1"
                      />
                    </td>
                  </tr>
                ))
              )}

              {/* Summary Row */}
              {rows.length > 0 && (
                <tr className="bg-gray-100 font-semibold">
                  <td
                    colSpan={2}
                    className="border px-3 py-2 text-right text-gray-700"
                  >
                    Totals:
                  </td>
                  <td className="border px-3 py-2 text-right text-gray-700">
                    {summary.totalSystem.toLocaleString()}
                  </td>
                  <td
                    className={`border px-3 py-2 text-right font-semibold ${
                      summary.diff > 0
                        ? "text-green-600"
                        : summary.diff < 0
                        ? "text-red-600"
                        : "text-gray-700"
                    }`}
                  >
                    {summary.totalOverride.toLocaleString()}
                  </td>
                  <td
                    className={`border px-3 py-2 text-right italic ${
                      summary.diff !== 0 ? "text-gray-600" : "text-gray-500"
                    }`}
                  >
                    Δ {summary.diff > 0 ? "+" : ""}
                    {summary.diff} ({summary.percentChange}%)
                  </td>
                </tr>
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
