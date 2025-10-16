import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"

type CensusOverrideRow = {
  id?: number
  date: string
  hour: string
  systemCensus?: number
  census: number
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

  // Load from context or JSON
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

      const enriched = json.map((row: any) => ({
        ...row,
        systemCensus: row.systemCensus ?? Math.floor(Math.random() * 50) + 20,
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

  const addRow = () => {
    const newRow: CensusOverrideRow = {
      id: Date.now(),
      date: "",
      hour: "",
      systemCensus: Math.floor(Math.random() * 50) + 20,
      census: 0,
      reason: "",
    }
    const updated = [...rows, newRow]
    setRows(updated)
    updateData("censusOverride", updated)
  }

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

  const handleToggle = () => setOverrideEnabled((prev) => !prev)

  const isOverridden = (r: CensusOverrideRow) =>
    r.systemCensus !== undefined && r.census !== r.systemCensus

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

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading census override data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Date</th>
                <th className="px-3 py-2 border">Hour</th>
                <th className="px-3 py-2 border text-right">System Census</th>
                <th className="px-3 py-2 border text-right">Override</th>
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

                    {/* Hour */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`hour_${i}`}
                        label=""
                        type="text"
                        placeholder="e.g. 07:00"
                        value={row.hour}
                        disabled={!overrideEnabled}
                        onChange={(e) =>
                          handleChange(i, "hour", e.target.value)
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* System Census */}
                    <td className="border px-2 py-1 text-right text-gray-500">
                      {row.systemCensus ?? "-"}
                    </td>

                    {/* Override Census */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`census_${i}`}
                        label=""
                        type="number"
                        min="0"
                        value={row.census}
                        disabled={!overrideEnabled}
                        onChange={(e) =>
                          handleChange(i, "census", Number(e.target.value))
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
