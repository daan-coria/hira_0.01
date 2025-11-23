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

import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);
dayjs.extend(isBetween);

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

    if (parts[0].length === 4) {
      yyyy = +parts[0];
      mm = +parts[1];
      dd = +parts[2];
    } else {
      mm = +parts[0];
      dd = +parts[1];
      yyyy = +parts[2];
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
    const match = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    if (!match) return "";
    let hh = +match[1];
    const mm = +match[2];
    const period = match[3]?.toUpperCase();
    if (period === "AM" && hh === 12) hh = 0;
    if (period === "PM" && hh !== 12) hh += 12;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  return "";
}

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

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp();
  const [rows, setRows] = useState<DemandRow[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [range, setRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const [startStr, endStr] = range;
  const showDots = Boolean(startStr && endStr);

  // ------------- FILE UPLOAD -------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

    const parsed: DemandRow[] = rowsRaw.map((r: any, i: number) => {
      const keys = Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k.trim().toLowerCase(), v])
      );

      const dateUS = excelSerialToUSDate(keys["event_date"] || "");
      const hour24 = excelTimeToHHMM(keys["hour_start"] || "");

      let demandValue = 0;
      const demandKey = Object.keys(keys).find((k) => k.includes("patient"));
      if (demandKey) {
        const raw = keys[demandKey];
        if (typeof raw === "number") demandValue = raw;
        else if (typeof raw === "string") {
          const parsedVal = parseFloat(raw.replace(/[^\d.-]/g, ""));
          if (!isNaN(parsedVal)) demandValue = parsedVal;
        }
      }

      const year = dateUS ? new Date(dateUS).getFullYear() : null;
      const weekNum = dateUS ? dayjs(dateUS).week() : 0;

      const day_of_week_full = dateUS ? dayjs(dateUS).format("dddd") : "";
      const day_of_week_short = dateUS ? dayjs(dateUS).format("ddd") : "";
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

  // ------------- LOAD FROM CONTEXT -------------
  useEffect(() => {
    if (rows.length === 0 && Array.isArray(data?.demand)) {
      setRows(data.demand as DemandRow[]);
    }
  }, [data?.demand, rows.length]);

  // Clear selected dates when date range changes
  useEffect(() => {
    setSelectedDates([]);
  }, [startStr, endStr]);

  // ------------- CHART DATA (DATE RANGE ONLY) -------------
  const chartRows = useMemo(() => {
    let base = [...rows];

    if (startStr && endStr) {
      const s = dayjs(startStr);
      const e = dayjs(endStr);

      base = base.filter((r) =>
        dayjs(r.date).isBetween(s, e, "day", "[]")
      );
    }

    return base;
  }, [rows, startStr, endStr]);

  const chartData = chartRows;

  // ------------- TABLE DATA (DATE RANGE + CLICKED DOTS) -------------
  const tableRows = useMemo(() => {
    if (selectedDates.length === 0) return [];
    return chartRows.filter((r) => selectedDates.includes(r.xLabel));
  }, [chartRows, selectedDates]);

  // ------------- MERGED DATA FOR MULTI-YEAR LINES -------------
  const mergedData = useMemo(() => {
    const map: Record<string, any> = {};

    chartData.forEach((row) => {
      const key = row.xLabel;
      const year = row.year?.toString() ?? "";

      if (!map[key]) map[key] = { xLabel: key };
      map[key][year] = row.demand_value;
    });

    return Object.values(map);
  }, [chartData]);

  const years = Array.from(
    new Set(chartData.map((r) => r.year?.toString()))
  ).filter(Boolean);

  const colors = ["#4f46e5", "#f97316", "#22c55e", "#eab308"];

  // ------------- CUSTOM AXIS (DAY LABELS + WEEK BARS) -------------
  const renderCustomAxis = () => {
    if (mergedData.length === 0) return null;

    const timeline = mergedData.map((d: any) => {
      const [week, day] = d.xLabel.split("-");
      return {
        xLabel: d.xLabel,
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

  // ------------- PAGINATION (TABLE) -------------
  const rowsPerPage = 24;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(tableRows.length / rowsPerPage);
  const visibleRows = tableRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Card className="p-4 space-y-4">
      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="w-[280px]">
          <label className="block text-xs font-medium mb-1">Date Range</label>
          <DatePickerInput
            type="range"
            value={range}
            onChange={setRange}
            numberOfColumns={2}
            dropdownType="modal"
            valueFormat="MM/DD/YYYY"
            clearable
          />
        </div>

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
      <div className="mt-2 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mergedData}
            onClick={(e: any) => {
              const label = e?.activePayload?.[0]?.payload?.xLabel;
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

      {/* Custom Axis Below Chart (only when range selected) */}
      {startStr && endStr && renderCustomAxis()}

      {/* TABLE — only after at least one dot has been clicked */}
      {selectedDates.length > 0 && (
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
