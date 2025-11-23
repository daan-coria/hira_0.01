import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/store/AppContext";
import Card from "@/components/ui/Card";
import * as XLSX from "xlsx";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";

import dayjs, { Dayjs } from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(weekOfYear);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// ---------- Excel Helpers ----------

function excelSerialToUSDate(v: unknown): string {
  if (typeof v === "number") {
    const base = Date.UTC(1899, 11, 30);
    const ms = v * 86400 * 1000;
    const d = new Date(base + ms);
    return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(
      d.getUTCDate()
    ).padStart(2, "0")}/${d.getUTCFullYear()}`;
  }

  if (typeof v === "string") {
    const clean = v.split(" ")[0].trim();
    const parts = clean.split(/[\/\-]/);
    let yyyy = 0,
      mm = 0,
      dd = 0;

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        yyyy = +parts[0];
        mm = +parts[1];
        dd = +parts[2];
      } else {
        mm = +parts[0];
        dd = +parts[1];
        yyyy = +parts[2];
      }
    }

    if (yyyy && mm && dd) {
      return `${String(mm).padStart(2, "0")}/${String(dd).padStart(
        2,
        "0"
      )}/${yyyy}`;
    }
  }

  return "";
}

function excelTimeToHHMM(v: unknown): string {
  if (typeof v === "number") {
    const totalSec = Math.round((v % 1) * 86400);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  if (typeof v === "string") {
    const match = v.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (match) {
      let hh = parseInt(match[1], 10);
      const mm = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();

      if (ampm === "PM" && hh < 12) hh += 12;
      if (ampm === "AM" && hh === 12) hh = 0;

      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
  }

  return "00:00";
}

// ---------- Sunday-based Week Number ----------

function getWeekStartingSunday(d: Dayjs): number {
  const startOfYear = dayjs(`${d.year()}-01-01`, "YYYY-MM-DD");
  const diffDays = d.startOf("day").diff(startOfYear.startOf("day"), "day");
  const offset = startOfYear.day(); // 0 = Sunday

  return Math.floor((diffDays + offset) / 7) + 1;
}

// ---------- Types ----------

type DemandRow = {
  id: number;
  date: string;
  hour: string;
  demand_value: number;
  year: number | null;

  weekNum: number;
  week_of_year: string;
  day_of_week_full: string;
  day_of_week_short: string;
  xLabel: string;
};

type Props = { onNext?: () => void; onPrev?: () => void };

// ============================================================================
//                              MAIN COMPONENT
// ============================================================================

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp();

  const [rows, setRows] = useState<DemandRow[]>([]);

  // ⬅️ No more selectedDates, click logic removed

  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);

  const [startDate, endDate] = range;
  const startStr = startDate ? dayjs(startDate).format("MM/DD/YYYY") : "";
  const endStr = endDate ? dayjs(endDate).format("MM/DD/YYYY") : "";

  // ---------- File Upload ----------

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

    const parsed: DemandRow[] = rowsRaw.map((r: any, i: number) => {
      const keys = Object.keys(r).reduce((acc: any, k) => {
        acc[k.trim().toLowerCase()] = r[k];
        return acc;
      }, {});

      const eventDate = keys["event_date"] ?? keys["date"];
      const hourStart = keys["hour_start"];
      const demandKey = Object.keys(keys).find((k) => k.includes("patient"));
      const patientsRaw = demandKey ? keys[demandKey] : 0;

      const dateUS = excelSerialToUSDate(eventDate);
      const hour24 = excelTimeToHHMM(hourStart);

      let demandValue = 0;
      if (typeof patientsRaw === "number") demandValue = patientsRaw;
      else if (typeof patientsRaw === "string") {
        const p = parseFloat(patientsRaw.replace(/[^\d.-]/g, ""));
        if (!isNaN(p)) demandValue = p;
      }

      const d = dateUS ? dayjs(dateUS, "MM/DD/YYYY") : null;
      const year = d ? d.year() : null;
      const weekNum = d ? getWeekStartingSunday(d) : 0;

      const day_full = d ? d.format("dddd") : "";
      const day_short = d ? d.format("ddd") : "";

      return {
        id: i,
        date: dateUS,
        hour: hour24,
        demand_value: demandValue,
        year,
        weekNum,
        week_of_year: `Week ${weekNum}`,
        day_of_week_full: day_full,
        day_of_week_short: day_short,
        xLabel: `${weekNum}-${day_short}`,
      };
    });

    setRows(parsed);
    updateData("demand", parsed);
  };

  // ---------- Load cached demand ----------

  useEffect(() => {
    if (rows.length === 0 && Array.isArray(data?.demand)) {
      setRows(data.demand as DemandRow[]);
    }
  }, [data?.demand, rows.length]);

  // ---------- Filter by Date Range ----------

  const chartRows = useMemo(() => {
    if (!startStr || !endStr) return rows;

    const s = dayjs(startStr, "MM/DD/YYYY");
    const e = dayjs(endStr, "MM/DD/YYYY");

    return rows.filter((r) =>
      dayjs(r.date, "MM/DD/YYYY").isBetween(s, e, "day", "[]")
    );
  }, [rows, startStr, endStr]);

  // ---------- mergedData for Chart ----------

  const mergedData = useMemo(() => {
    const map: Record<string, any> = {};

    chartRows.forEach((row) => {
      const key = row.xLabel;
      const year = row.year?.toString() ?? "";

      if (!map[key]) {
        map[key] = {
          xLabel: key,
          originalDate: row.date,
        };
      }

      if (year) map[key][year] = row.demand_value;
    });

    return Object.values(map);
  }, [chartRows]);

  const years = Array.from(
    new Set(chartRows.map((r) => r.year?.toString()))
  ).filter(Boolean) as string[];

  const colors = ["#4f46e5", "#f97316", "#22c55e", "#eab308"];

  // ---------- Table Pagination ----------

  const rowsPerPage = 24;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(chartRows.length / rowsPerPage);
  const visibleRows = chartRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // ========================================================================
  //                              RENDER
  // ========================================================================

  return (
    <Card className="p-4 space-y-4">

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Date Range */}
        <div className="w-[300px]">
          <label className="block text-xs font-medium mb-1">Date Range</label>

          <DatePickerInput
            type="range"
            value={range}
            onChange={(value) =>
              setRange(value as [Date | null, Date | null])
            }
            numberOfColumns={2}
            dropdownType="modal"
            placeholder="Select date range"
            valueFormat="MM/DD/YYYY"
            clearable
          />
        </div>

        {/* Upload File */}
        <div className="ml-auto">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="text-sm"
          />
        </div>
      </div>

      {/* CHART */}
      {startStr && endStr && (
        <div className="mt-2 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="xLabel" tick={false} axisLine={false} />
              <YAxis />
              <Tooltip />
              <Legend />

              {years.map((y, i) => (
                <Line
                  key={y}
                  dataKey={y}
                  name={`Year ${y}`}
                  type="monotone"
                  stroke={colors[i % colors.length]}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TABLE ALWAYS SHOWS WHEN DATE RANGE SELECTED */}
      {startStr && endStr && (
        <>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 border text-center">Week</th>
                  <th className="px-3 py-2 border text-center">Day</th>
                  <th className="px-3 py-2 border text-center">Date</th>
                  <th className="px-3 py-2 border text-center">Hour</th>
                  <th className="px-3 py-2 border text-center">Demand</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                    <td className="border px-2 py-1 text-center">
                      {r.week_of_year}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {r.day_of_week_full}
                    </td>
                    <td className="border px-2 py-1 text-center">{r.date}</td>
                    <td className="border px-2 py-1 text-center">{r.hour}</td>
                    <td className="border px-2 py-1 text-right">
                      {r.demand_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  ← Prev
                </button>

                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="flex justify-between mt-6">
            <button className="btn btn-ghost" onClick={onPrev}>
              ← Previous
            </button>
            <button className="btn btn-primary" onClick={onNext}>
              Next →
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
