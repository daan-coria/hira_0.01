import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"
import { FaInfoCircle } from "react-icons/fa"

type CensusRow = {
  id?: number
  date: string
  hour: string
  census: number
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<CensusRow[]>([])
  const [saving, setSaving] = useState(false)

  const debouncedSave = useCallback(
    debounce((updated: CensusRow[]) => {
      setSaving(true)
      updateData("censusOverride", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  useEffect(() => {
    const censusData = Array.isArray(data?.censusOverride)
      ? data.censusOverride
      : []
    setRows(censusData)
  }, [data?.censusOverride])

  const handleAdd = () => {
    const newRow: CensusRow = {
      id: Date.now(),
      date: "",
      hour: "",
      census: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    updateData("censusOverride", updated)
  }

  const handleChange = (index: number, field: keyof CensusRow, value: string) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, [field]: field === "census" ? Number(value) : value } : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Census Override
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={handleAdd}>+ Add Row</Button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-gray-500">No census data available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    Date
                    <FaInfoCircle
                      title="Date: The calendar day for which the census count applies."
                      className="text-blue-500 cursor-pointer"
                      size={13}
                    />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    Hour
                    <FaInfoCircle
                      title="Hour: Time of day (in 24-hour format) when census was recorded."
                      className="text-blue-500 cursor-pointer"
                      size={13}
                    />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    Census
                    <FaInfoCircle
                      title="Census: Total number of occupied beds or patients at that date and hour."
                      className="text-blue-500 cursor-pointer"
                      size={13}
                    />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`date_${i}`}
                      label=""
                      type="date"
                      value={row.date}
                      onChange={(e) => handleChange(i, "date", e.target.value)}
                      className="!m-0 !p-1 w-full"
                    />
                  </td>

                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`hour_${i}`}
                      label=""
                      type="time"
                      value={row.hour}
                      onChange={(e) => handleChange(i, "hour", e.target.value)}
                      className="!m-0 !p-1 w-full"
                    />
                  </td>

                  <td className="border px-2 py-1 text-right">
                    <Input
                      id={`census_${i}`}
                      label=""
                      type="number"
                      value={row.census}
                      onChange={(e) => handleChange(i, "census", e.target.value)}
                      className="!m-0 !p-1 w-24 text-right"
                    />
                  </td>

                  <td className="border px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs text-red-600"
                      onClick={() =>
                        setRows((prev) => {
                          const updated = prev.filter((_, idx) => idx !== i)
                          updateData("censusOverride", updated)
                          return updated
                        })
                      }
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
