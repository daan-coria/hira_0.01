import { useEffect, useMemo, useState } from "react"
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

// Excel serial or US-style string (9/25/2024) → ISO date YYYY-MM-DD
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
    const clean = v.split(" ")[0].trim()
    const parts = clean.split(/[\/\-]/)
    let yyyy = 0,
      mm = 0,
      dd = 0

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        yyyy = parseInt(parts[0])
        mm = parseInt(parts[1])
        dd = parseInt(parts[2])
      } else {
        mm = parseInt(parts[0])
        dd = parseInt(parts[1])
        yyyy = parseInt(parts[2])
      }
    }

    if (yyyy && mm && dd) {
      return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`
    }
  }

  return ""
}

// Excel time (fraction or AM/PM string) -> 24h HH:MM
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
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedSeries, setSelectedSeries] = useState<string>("unit")

  useEffect(() => {
    if (Array.isArray(data?.demand)) setRows(data.demand)
  }, [data?.demand])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[]

    const parsed: DemandRow[] = rowsRaw.map((r: any, i: number) => {
      const keys = Object.keys(r).reduce((acc: any, k) => {
        acc[k.trim().toLowerCase()] = r[k];
        return acc;
      }, {});

      const facility = keys["fac"] || "";
      const unit = keys["unit"] || "";
      const eventDate = keys["event_date"] || "";
      const hourStart = keys["hour_start"] || "";
      const demandKey = Object.keys(keys).find((k) => k.includes("patient"));
      const patientsRaw = demandKey ? keys[demandKey] : 0;

      const dateISO = excelSerialToISODate(eventDate);
      const hour24 = excelTimeToHHMM(hourStart);

      let demandValue = 0;
      if (typeof patientsRaw === "number") demandValue = patientsRaw;
      else if (typeof patientsRaw === "string") {
        const parsedVal = parseFloat(patientsRaw.replace(/[^\d.-]/g, ""));
        if (!isNaN(parsedVal)) demandValue = parsedVal;
      }

      const year =
        dateISO && !isNaN(Date.parse(dateISO))
          ? new Date(dateISO).getFullYear()
          : undefined;

      return {
        id: i,
        facility: String(facility).trim(),
        unit: String(unit).trim(),
        cc: "",
        date: dateISO,
        hour: hour24,
        demand_value: demandValue,
        year,
      };
    });

    // Debug: show parsed results
    console.log("📘 Parsed demand rows (first 20):", parsed.slice(0, 20));
    console.log(
      "📅 Unique parsed dates:",
      Array.from(new Set(parsed.map((r) => r.date))).sort()
    );
    console.log(
      "🗓️ Parsed year distribution:",
      Array.from(new Set(parsed.map((r) => r.year))).sort()
    );

    setRows(parsed)
    updateData("demand", parsed)
  }

  const years = Array.from(new Set(rows.map((r) => r.year))).filter(Boolean)
  const seriesOptions = ["facility", "unit"]

  // 🧠 Normalized data grouped by Month + DayOfWeek
  const normalizedData = useMemo(() => {
    if (!selectedYear) return [];

    // 🧩 Filter by selected year
    const filtered = rows.filter(
      (r) => String(r.year) === String(selectedYear)
    );

    console.log("🧩 Filtered rows for year", selectedYear, ":", filtered.length);

    if (filtered.length === 0) return [];

    const groups: Record<string, { total: number; count: number }> = {};

    filtered.forEach((r) => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;

      const month = d.getMonth() + 1; // 1–12
      const dayOfWeek = d.getDay(); // 0=Sun..6=Sat
      const seriesKey = selectedSeries === "facility" ? r.facility : r.unit;
      const key = `${seriesKey}__${month}__${dayOfWeek}`;

      if (!groups[key]) groups[key] = { total: 0, count: 0 };
      groups[key].total += r.demand_value;
      groups[key].count += 1;
    });

    console.log("🧮 Normalization groups:", Object.keys(groups).length);

    const normalized = Object.entries(groups).map(([key, v]) => {
      const [seriesKey, month, dayOfWeek] = key.split("__");
      return {
        series: seriesKey,
        month: Number(month),
        dayOfWeek: Number(dayOfWeek),
        avgDemand: v.total / v.count,
      };
    });

    console.log("✅ Normalized data sample:", normalized.slice(0, 10));
    return normalized;
  }, [rows, selectedYear, selectedSeries]);



  const colors = ["#4f46e5", "#22c55e", "#eab308", "#ef4444", "#06b6d4"]

  // ✅ Log what’s about to be sent to the chart
  console.log("🎨 Chart data sample:", normalizedData.slice(0, 10))

  {normalizedData.length === 0 && selectedYear && (
  <p className="text-red-500 text-sm">
    ⚠️ No normalized data found for {selectedYear}. Check parsed year values in console.
  </p>
)}

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

      {/* 🧭 Filter controls */}
      <div className="flex gap-4 mb-4">
        <div>
          <label
            htmlFor="yearSelect"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Year
          </label>
          <select
            id="yearSelect"
            title="Select Year"
            className="border rounded p-1 text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="seriesSelect"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Series
          </label>
          <select
            id="seriesSelect"
            title="Select Series"
            className="border rounded p-1 text-sm"
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
          >
            {seriesOptions.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🧾 Table */}
      {rows.length === 0 ? (
        <p className="text-gray-500">Upload a file to display demand data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-center">Facility</th>
                <th className="px-3 py-2 border text-center">Unit</th>
                <th className="px-3 py-2 border text-center">CC</th>
                <th className="px-3 py-2 border text-center">Date</th>
                <th className="px-3 py-2 border text-center">Hour</th>
                <th className="px-3 py-2 border text-center">Demand Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row, i) => (
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
      )}

      {normalizedData.length === 0 && selectedYear && (
        <p className="text-red-500 text-sm">
          ⚠️ No normalized data found for {selectedYear}. Check parsed year values in console.
        </p>
      )}

      {/* 📊 Normalized Chart: X = Month, Lines = Day of Week */}
      {normalizedData.length > 0 && (
        <div className="mt-6 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={normalizedData}
              margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                type="number"
                domain={[1, 12]}
                tickFormatter={(m) =>
                  new Date(2024, m - 1, 1).toLocaleString(undefined, {
                    month: "short",
                  })
                }
                label={{
                  value: "Month",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                label={{
                  value: "Average Demand",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(v: any) =>
                  typeof v === "number" ? v.toFixed(2) : String(v)
                }
                labelFormatter={(m) =>
                  `Month: ${new Date(2024, m - 1, 1).toLocaleString(undefined, {
                    month: "long",
                  })}`
                }
              />

              <Legend />
              {Array.from(new Set(normalizedData.map((r) => r.dayOfWeek))).map(
                (dow, idx) => (
                  <Line
                    key={dow}
                    type="monotone"
                    dataKey="avgDemand"
                    name={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow]}
                    data={normalizedData.filter((r) => r.dayOfWeek === dow)}
                    stroke={[
                      "#ef4444", // Sunday
                      "#f97316", // Monday
                      "#eab308", // Tuesday
                      "#22c55e", // Wednesday
                      "#06b6d4", // Thursday
                      "#3b82f6", // Friday
                      "#8b5cf6", // Saturday
                    ][idx % 7]}
                    dot={false}
                  />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
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
