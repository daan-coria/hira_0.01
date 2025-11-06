import { useEffect, useState, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import InfoButton from "@/components/ui/InfoButton"
import debounce from "lodash.debounce"

type DemandRow = {
  id?: number
  facility: string
  cc: string
  date: string
  hour: string
  demand_value: number
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<DemandRow[]>([])
  const [saving, setSaving] = useState(false)

  const debouncedSave = useCallback(
    debounce((updated: DemandRow[]) => {
      setSaving(true)
      updateData("demand", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  useEffect(() => {
    const existing = Array.isArray(data?.demand) ? data.demand : []
    setRows(existing)
  }, [data?.demand])

  const handleAdd = () => {
    const newRow: DemandRow = {
      id: Date.now(),
      facility: "",
      cc: "",
      date: "",
      hour: "",
      demand_value: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    updateData("demand", updated)
  }

  const handleChange = (index: number, field: keyof DemandRow, value: string) => {
    const updated = rows.map((r, i) =>
      i === index
        ? { ...r, [field]: field === "demand_value" ? Number(value) : value }
        : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Demand</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={handleAdd}>+ Add Row</Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No demand data available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    Facility
                    <InfoButton text="The facility or department where demand is recorded." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    CC
                    <InfoButton text="Cost Center or unit code associated with this demand record." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    Date
                    <InfoButton text="The calendar day for the demand record." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    Hour
                    <InfoButton text="Time of day (24-hour format) when demand was measured." />
                  </div>
                </th>
                <th className="px-3 py-2 border text-center">
                  <div className="flex items-center justify-center gap-1">
                    Demand Value
                    <InfoButton text="The numerical value representing demand (e.g., census, workload, or volume)." />
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
                      id={`facility_${i}`}
                      label=""
                      value={row.facility}
                      onChange={(e) => handleChange(i, "facility", e.target.value)}
                      placeholder="Facility name"
                      className="!m-0 !p-1 w-full"
                    />
                  </td>

                  <td className="border px-2 py-1 text-center">
                    <Input
                      id={`cc_${i}`}
                      label=""
                      value={row.cc}
                      onChange={(e) => handleChange(i, "cc", e.target.value)}
                      placeholder="CC code"
                      className="!m-0 !p-1 w-full"
                    />
                  </td>

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
                      id={`demand_value_${i}`}
                      label=""
                      type="number"
                      value={row.demand_value}
                      onChange={(e) =>
                        handleChange(i, "demand_value", e.target.value)
                      }
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
                          updateData("demand", updated)
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
