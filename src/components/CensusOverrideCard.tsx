import { useEffect, useState } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

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

  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  // Load from global context or mock JSON
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

      // Add systemCensus baseline if missing (simulating model output)
      const enriched = json.map((row: any) => ({
        ...row,
        systemCensus: row.systemCensus ?? Math.floor(Math.random() * 50) + 20, // fake baseline for dev
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

  const saveRow = (row: CensusOverrideRow) => {
    const updated = row.id
      ? rows.map(r => (r.id === row.id ? row : r))
      : [...rows, { ...row, id: Date.now() }]
    setRows(updated)
    updateData("censusOverride", updated)
  }

  const removeRow = (id?: number) => {
    if (!id) return
    const updated = rows.filter(r => r.id !== id)
    setRows(updated)
    updateData("censusOverride", updated)
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

  // Toggle override mode
  const handleToggle = () => {
    setOverrideEnabled(prev => !prev)
  }

  // Helper: determine if row differs from system
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
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
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
                        onChange={e => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, date: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("censusOverride", updated)
                        }}
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
                        onChange={e => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, hour: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("censusOverride", updated)
                        }}
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
                        onChange={e => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, census: Number(e.target.value) }
                              : r
                          )
                          setRows(updated)
                          updateData("censusOverride", updated)
                        }}
                        className={`!m-0 !p-1 w-20 text-right ${
                          isOverridden(row) ? "border-yellow-400 bg-yellow-50" : ""
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
                        onChange={e => {
                          const updated = rows.map((r, idx) =>
                            idx === i
                              ? { ...r, reason: e.target.value }
                              : r
                          )
                          setRows(updated)
                          updateData("censusOverride", updated)
                        }}
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Actions */}
                    <td className="border px-2 py-1 text-center space-x-2">
                      <Button
                        onClick={() => saveRow(row)}
                        variant="primary"
                        className="!px-2 !py-1 text-xs"
                        disabled={!overrideEnabled}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => removeRow(row.id)}
                        variant="ghost"
                        className="!px-2 !py-1 text-xs text-red-600"
                        disabled={!overrideEnabled}
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
