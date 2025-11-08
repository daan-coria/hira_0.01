import { useEffect, useState } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import InfoButton from "@/components/ui/InfoButton"
import * as XLSX from "xlsx"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type DemandRow = {
  id?: number
  facility: string
  cc: string
  date: string
  hour: string
  demand_value: number
  year?: number
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<DemandRow[]>([])

  // Load saved data (if available)
  useEffect(() => {
    if (Array.isArray(data?.demand)) setRows(data.demand)
  }, [data?.demand])

  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[]

    const parsed: DemandRow[] = json.map((r, i) => {
      const dateStr = r.Date || r.date || ""
      const d = new Date(dateStr)
      return {
        id: i,
        facility: r.Facility || r.facility || "",
        cc: r.CC || r.cc || "",
        date: dateStr,
        hour: r.Hour || r.hour || "",
        demand_value: Number(r["Demand Value"] || r.Demand || r.demand_value || 0),
        year: d.getFullYear(),
      }
    })

    setRows(parsed)
    updateData("demand", parsed)
  }

  // Prepare chart data
  const chartData = rows.map((r) => ({
    x: new Date(r.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    year: r.year,
    demand_value: r.demand_value,
  }))

  const uniqueYears = [...new Set(chartData.map((d) => d.year))]

  // Auto color generator per year
  const colors = ["#4f46e5", "#22c55e", "#eab308", "#ef4444", "#06b6d4"]

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Demand</h3>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="text-sm"
          aria-label="Upload demand Excel file"
          title="Upload Excel file to prepopulate demand table"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">Upload a file to display demand data.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Facility
                      <InfoButton text="Facility or department name." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      CC
                      <InfoButton text="Cost center or unit code." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Date
                      <InfoButton text="Date of the demand record." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Hour
                      <InfoButton text="Hour of the day (24-hour format)." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Demand Value
                      <InfoButton text="Recorded demand or census count." />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <td className="border px-2 py-1 text-center">{row.facility}</td>
                    <td className="border px-2 py-1 text-center">{row.cc}</td>
                    <td className="border px-2 py-1 text-center">{row.date}</td>
                    <td className="border px-2 py-1 text-center">{row.hour}</td>
                    <td className="border px-2 py-1 text-right">{row.demand_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" allowDuplicatedCategory={false} />
                <YAxis />
                <Tooltip />
                <Legend />
                {uniqueYears.map((year, idx) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey="demand_value"
                    name={`Year ${year}`}
                    stroke={colors[idx % colors.length]}
                    data={chartData.filter((d) => d.year === year)}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="flex justify-between mt-6">
        <button className="btn btn-ghost" onClick={onPrev}>
          ← Previous
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Next →
        </button>
      </div>
    </Card>
  )
}
