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

// Mantine date range picker
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";

import dayjs, { Dayjs } from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(weekOfYear);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// ---------- Helpers ----------

// Excel serial → US date MM/DD/YYYY
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
        // yyyy-mm-dd
        yyyy = +parts[0];
        mm = +parts[1];
        dd = +parts[2];
      } else {
        // mm-dd-yyyy or mm/dd/yyyy
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

// Excel time → 24h HH:MM
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

// Week number with weeks starting on Sunday
function getWeekStartingSunday(d: Dayjs): number {
  const startOfYear = dayjs(`${d.year()}-01-01`, "YYYY-MM-DD");
  const diffDays = d.startOf("day").diff(startOfYear.startOf("day"), "day");
  // Offset so that weeks start on Sunday (day() === 0)
  const offset = startOfYear.day(); // 0–6, where 0 is Sunday
  return Math.floor((diffDays + offset) / 7) + 1;
}

// ---------- Types ----------

type DemandRow = {
  id: number;
  date: string; // MM/DD/YYYY
  hour: string; // HH:MM 24h
  demand_value: number;
  year: number | null;

  weekNum: number;
  week_of_year: string;
  day_of_week_full: string;
  day_of_week_short: string;
  xLabel: string; // `${weekNum}-${dayShort}`
};

type Props = { onNext: () => void; onPrev: () => void };

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp();

  const [rows, setRows] = useState<DemandRow[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);


  const [startDate, endDate] = range;
  const startStr = startDate ? dayjs(startDate).format("MM/DD/YYYY") : "";
  const endStr = endDate ? dayjs(endDate).format("MM/DD/YYYY") : "";
  const showDots = Boolean(startStr && endStr);

  // ---------- File upload (only 5 columns used) ----------

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
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
      }, {} as Record<string, any>);

      const eventDate = keys["event_date"] ?? keys["date"] ?? "";
      const hourStart = keys["hour_start"] ?? keys["time"] ?? "";
      const demandKey = Object.keys(keys).find((k) => k.includes("patient"));
      const patientsRaw = demandKey ? keys[demandKey] : 0;

      const dateUS = excelSerialToUSDate(eventDate); // MM/DD/YYYY
      const hour24 = excelTimeToHHMM(hourStart);

      let demandValue = 0;
      if (typeof patientsRaw === "number") {
        demandValue = patientsRaw;
      } else if (typeof patientsRaw === "string") {
        const parsedVal = parseFloat(patientsRaw.replace(/[^\d.-]/g, ""));
        if (!isNaN(parsedVal)) demandValue = parsedVal;
      }

      const d = dateUS ? dayjs(dateUS, "MM/DD/YYYY") : null;
      const year = d ? d.year() : null;
      const weekNum = d ? getWeekStartingSunday(d) : 0;
      const day_of_week_full = d ? d.format("dddd") : "";
      const day_of_week_short = d ? d.format("ddd") : "";
      const week_of_year = `Week ${weekNum}`;
      const xLabel = `${weekNum}-${day_of_week_short}`;

      return {
        id: i,
        date: dateUS,
        hour: hour24,
        demand_value: demandValue,
        year,
        weekNum,
        week_of_year,
        day_of_week_full,
        day_of_week_short,
        xLabel,
      };
    });

    setRows(parsed);
    updateData("demand", parsed);
  };

  // ---------- Load from context ----------

  useEffect(() => {
    if (rows.length === 0 && Array.isArray(data?.demand)) {
      setRows(data.demand as DemandRow[]);
    }
  }, [data?.demand, rows.length]);

  // Clear selected dates when date range changes
  useEffect(() => {
    setSelectedDates([]);
  }, [startStr, endStr]);

  // ---------- CHART DATA (date range only) ----------

  const chartRows = useMemo(() => {
    let base = [...rows];

    if (startStr && endStr) {
      const s = dayjs(startStr, "MM/DD/YYYY");
      const e = dayjs(endStr, "MM/DD/YYYY");

      base = base.filter((r) =>
        r.date
          ? dayjs(r.date, "MM/DD/YYYY").isBetween(s, e, "day", "[]")
          : false
      );
    }

    return base;
  }, [rows, startStr, endStr]);

  const chartData = chartRows;

  // ---------- TABLE DATA (date range + clicked dots) ----------

  const tableRows = useMemo(() => {
    if (selectedDates.length === 0) return [];
    return chartRows.filter((r) => selectedDates.includes(r.date));
  }, [chartRows, selectedDates]);

  // ---------- Merge for multi-year lines ----------

  const mergedData = useMemo(() => {
    const map: Record<string, any> = {};

    chartData.forEach((row) => {
      const key = row.xLabel;
      const year = row.year?.toString() ?? "";

      if (!map[key]) {
        map[key] = { xLabel: key, originalDate: row.date };
      }

      if (year) {
        map[key][year] = row.demand_value;
      }
    });

    return Object.values(map);
  }, [chartData]);

  const years = Array.from(
    new Set(chartData.map((r) => r.year?.toString()))
  ).filter(Boolean) as string[];

  const colors = ["#4f46e5", "#f97316", "#22c55e", "#eab308"];

  // ---------- Custom axis under chart (days + week bars) ----------

  const renderCustomAxis = () => {
    if (mergedData.length === 0) return null;

    const timeline = mergedData.map((d: any) => {
      const [week, day] = (d.xLabel as string).split("-");
      return {
        xLabel: d.xLabel as string,
        week: Number(week),
        day,
      };
    });

    const orderedWeeks = Array.from(new Set(timeline.map((x) => x.week)));

    return (
      <div className="w-full mt-4 select-none">
        {/* Day labels */}
        <div className="flex text-xs font-medium text-gray-700 justify-between">
          {timeline.map((t, idx) => (
            <div
              key={idx}
              style={{
                width: `${100 / timeline.length}%`,
                textAlign: "center",
              }}
            >
              {t.day}
            </div>
          ))}
        </div>

        {/* Week bars */}
        <div className="flex mt-2">
          {orderedWeeks.map((wk) => {
            const count = timeline.filter((t) => t.week === wk).length;
            return (
              <div
                key={wk}
                style={{
                  width: `${(count / timeline.length) * 100}%`,
                  padding: "4px 0",
                  textAlign: "center",
                }}
              >
                <div className="h-1 bg-blue-600 rounded-full mb-1" />
                <div className="text-blue-700 font-semibold">{wk}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------- Pagination for table ----------

  const rowsPerPage = 24;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(tableRows.length / rowsPerPage);
  const visibleRows = tableRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // ---------- Render ----------

  return (
    <Card className="p-4 space-y-4">
      {/* TOP BAR */}
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
            valueFormat="MM/DD/YYYY"
            clearable
          />
        </div>

        {/* Upload File */}
        <div className="ml-auto">
          <input
            type="file"
            accept=".xlsx,xls"
            onChange={handleFileUpload}
            className="text-sm"
          />
        </div>
      </div>

      {/* CHART */}
      <div className="mt-2 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mergedData}
            onClick={(e: any) => {
              const label: string | undefined =
                e?.activePayload?.[0]?.payload?.originalDate;
              if (!label) return;

              setSelectedDates((prev) =>
                prev.includes(label)
                  ? prev.filter((x) => x !== label)
                  : [...prev, label]
              );
              setPage(1);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="xLabel"
              tick={false}
              axisLine={false}
              hide={!startStr || !endStr}
            />
            <YAxis />
            <Tooltip />
            <Legend />

            {years.map((y, i) => (
              <Line
                key={y}
                type="monotone"
                dataKey={y}
                name={`Year ${y}`}
                stroke={colors[i % colors.length]}
                dot={showDots ? { r: 4 } : false}
                activeDot={showDots ? { r: 6 } : false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ===== TABLE (ALWAYS SHOW AFTER DATE RANGE) ===== */}
      {startStr && endStr && (
        <>
          <div className="overflow-x-auto">
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
                    <td className="border px-2 py-1 text-center">{r.week_of_year}</td>
                    <td className="border px-2 py-1 text-center">{r.day_of_week_full}</td>
                    <td className="border px-2 py-1 text-center">{r.date}</td>
                    <td className="border px-2 py-1 text-center">{r.hour}</td>
                    <td className="border px-2 py-1 text-right">{r.demand_value}</td>
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

                <span className="text-sm">
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
