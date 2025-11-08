import { useEffect, useState } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
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

// --- Excel date serial -> ISO string (YYYY-MM-DD) ---
function excelSerialToISODate(v: unknown): string {
  if (typeof v === "number") {
    const base = Date.UTC(1899, 11, 30)
    const ms = v * 86400 * 1000
    const d = new Date(base + ms)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`
  }
  if (typeof v === "string") {
    const d = new Date(v)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    }
  }
  return ""
}

// --- Excel time (fraction or AM/PM string) -> 24h HH:MM ---
function excelTimeToHHMM(v: unknown): string {
  if (typeof v === "number") {
    const totalSec = Math.round((v % 1) * 86400)
    const hh = Math.floor(totalSec / 3600)
    const mm = Math.floor((totalSec % 3600) / 60)
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  }
  if (typeof v === "string") {
    const match = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)
    if (match) {
      let hh = parseInt(match[1], 10)
      const mm = parseInt(match[2], 10)
      const period = match[3]?.toUpperCase()
      if (period === "AM" && hh === 12) hh = 0
      if (period === "PM" && hh !== 12) hh += 12
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
    }
  }
  return ""
}

// --- Data type ---
type DemandRow = {
  id?: number
  facility: string
  unit: string
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

  useEffect(() => {
    if (Array.isArray(data?.demand)) setRows(data.demand)
  }, [data?.demand])

  // --- Excel Upload Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[]

    const parsed: DemandRow[] = rowsRaw.map((r: any, i: number) => {
      const facility = r.fac ?? ""
      const unit = r.unit ?? ""
      const eventDate = r.event_date ?? ""
      const hourStart = r.hour_start ?? ""
      const patientsRaw = r.patients_present ?? 0

      const dateISO = excelSerialToISODate(eventDate)
      const hour24 = excelTimeToHHMM(hourStart)

      // Force numeric conversion for Demand Value
      const demandValue = Number(patientsRaw) || parseFloat(String(patientsRaw)) || 0

      return {
        id: i,
        facility: String(facility).trim(),
        unit: String(unit).trim(),
        cc: "",
        date: dateISO,
        hour: hour24,
        demand_value: demandValue,
        year: dateISO ? new Date(dateISO).getFullYear() : undefined,
      }
    })

    setRows(parsed)
    updateData("demand", parsed)
  }

  // --- Chart Data ---
  const chartData = rows.map((r) => ({
    x: new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    year: r.year,
    demand_value: r.demand_value,
  }))

  const uniqueYears = [...new Set(chartData.map((d) => d.year))]
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
                      Facility <InfoButton text="Facility or department name." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Unit <InfoButton text="Specific nursing unit or area." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      CC <InfoButton text="Cost center or unit code." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Date <InfoButton text="Date of the demand record." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Hour <InfoButton text="Hour of the day (24-hour format)." />
                    </div>
                  </th>
                  <th className="px-3 py-2 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      Demand Value{" "}
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
                    <td className="border px-2 py-1 text-center">{row.unit}</td>
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
