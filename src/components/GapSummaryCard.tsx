import { useEffect, useState } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"

type GapSummaryRow = {
  id?: number
  department: string
  shift: string
  available_fte: number
  required_fte: number
  gap: number
}

export default function GapSummaryCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<GapSummaryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilitySetup) {
      fetchGaps()
    }
  }, [facilitySetup])

  const fetchGaps = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)

      const query = new URLSearchParams({
        facility: facilitySetup.facility,
        department: facilitySetup.department,
        costCenter: facilitySetup.costCenter,
        bedCount: String(facilitySetup.bedCount),
        start: facilitySetup.dateRange.start,
        end: facilitySetup.dateRange.end,
      })

      const res = await fetch(`/api/gap-summary?${query.toString()}`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      console.error("Failed to load gap summary", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-3">Gap Summary</h3>

      {loading ? (
        <p className="text-gray-500">Loading gap summary...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">No gap data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th scope="col" className="px-3 py-2 border text-left">
                  Department
                </th>
                <th scope="col" className="px-3 py-2 border text-left">
                  Shift
                </th>
                <th scope="col" className="px-3 py-2 border text-right">
                  Available FTE
                </th>
                <th scope="col" className="px-3 py-2 border text-right">
                  Required FTE
                </th>
                <th scope="col" className="px-3 py-2 border text-right">
                  Gap
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td className="border px-2 py-1">{row.department}</td>
                  <td className="border px-2 py-1">{row.shift}</td>
                  <td className="border px-2 py-1 text-right">
                    {row.available_fte}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {row.required_fte}
                  </td>
                  <td
                    className={`border px-2 py-1 text-right font-semibold ${
                      row.gap < 0
                        ? "text-red-600"
                        : row.gap > 0
                        ? "text-green-600"
                        : "text-gray-700"
                    }`}
                  >
                    {row.gap}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
