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
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Excel serial or US-style string (9/25/2024) → US date MM/DD/YYYY
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
        yyyy = parseInt(parts[0]);
        mm = parseInt(parts[1]);
        dd = parseInt(parts[2]);
      } else {
        mm = parseInt(parts[0]);
        dd = parseInt(parts[1]);
        yyyy = parseInt(parts[2]);
      }
    }

    if (yyyy && mm && dd) {
      return `${String(mm).padStart(2, "0")}/${String(dd).padStart(2, "0")}/${yyyy}`;
    }
  }

  return "";
}

// Excel time (fraction or AM/PM string) -> 24h HH:MM
function excelTimeToHHMM(v: unknown): string {
  if (typeof v === "number") {
    const totalSec = Math.round((v % 1) * 86400);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  if (typeof v === "string") {
    const match = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    if (match) {
      let hh = parseInt(match[1], 10);
      const mm = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase();
      if (period === "AM" && hh === 12) hh = 0;
      if (period === "PM" && hh !== 12) hh += 12;
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
  }
  return "";
}

type DemandRow = {
  id?: number;
  facility: string;
  unit: string;
  cc: string;
  date: string;
  hour: string;
  demand_value: number;
  year?: number;
};

type Props = { onNext?: () => void; onPrev?: () => void };

export default function CensusOverrideCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp();
  const [rows, setRows] = useState<DemandRow[]>([]);

  // SERIES
  const [selectedSeries, setSelectedSeries] = useState<string>("unit");
  const seriesOptions = ["facility", "unit"];

  // MANTINE DATE RANGE (native JS Dates)
  const [range, setRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const [startStr, endStr] = range;


  // File upload
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

      const facility = keys["fac"] || "";
      const unit = keys["unit"] || "";
      const eventDate = keys["event_date"] || "";
      const hourStart = keys["hour_start"] || "";
      const demandKey = Object.keys(keys).find((k) => k.includes("patient"));
      const patientsRaw = demandKey ? keys[demandKey] : 0;

      const dateUS = excelSerialToUSDate(eventDate);
      const hour24 = excelTimeToHHMM(hourStart);

      let demandValue = 0;
      if (typeof patientsRaw === "number") demandValue = patientsRaw;
      else if (typeof patientsRaw === "string") {
        const parsedVal = parseFloat(patientsRaw.replace(/[^\d.-]/g, ""));
        if (!isNaN(parsedVal)) demandValue = parsedVal;
      }

      return {
        id: i,
        facility,
        unit,
        cc: "",
        date: dateUS,
        hour: hour24,
        demand_value: demandValue,
      };
    });

    setRows(parsed);
    updateData("demand", parsed);
  };

  useEffect(() => {
    if (rows.length === 0 && Array.isArray(data?.demand) && data.demand.length > 0) {
      setRows(data.demand);
    }
  }, [data?.demand]);

  // Filtering based on Mantine’s date range
  const filteredRows = useMemo(() => {
    if (!startStr || !endStr) return rows;

    const start = dayjs(startStr);
    const end = dayjs(endStr);

    return rows.filter((r) => {
      const normalized = r.date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2");
      const d = dayjs(normalized);

      return d.isSameOrAfter(start, "day") && d.isSameOrBefore(end, "day");
    });
  }, [rows, startStr, endStr]);


  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 24;
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage;
  const visibleRows = filteredRows.slice(startIdx, startIdx + rowsPerPage);
  const chartData = filteredRows;

  // Group data by year
  const groupedByYear = useMemo(() => {
  const groups: Record<string, any[]> = {};

  chartData.forEach((row) => {
    if (!row.date || !row.year) return;

    const year = row.year.toString();
    if (!groups[year]) groups[year] = [];

    const [m, d] = row.date.split("/");
    const dayKey = `${m}-${d}`;

    groups[year].push({
      ...row,
      dayKey,
    });
  });

  return groups;
}, [chartData]);

  const mergedData = useMemo(() => {
  const map: Record<string, any> = {};

  chartData.forEach((row) => {
    if (!row.date || !row.year) return;

    const [m, d] = row.date.split("/");
    const dayKey = `${m}-${d}`;
    const year = row.year.toString();

    if (!map[dayKey]) {
      map[dayKey] = { dayKey };
    }

    map[dayKey][year] = row.demand_value;
  });

  return Object.values(map);
}, [chartData]);

  const colors = [
  "#4f46e5",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
];

  return (
    <Card className="p-4 space-y-4">

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 items-end">

        {/* Series */}
        <div>
          <label className="block text-xs font-medium mb-1">Series</label>
          <select
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

        {/* Date Range */}
        <div className="w-[300px]">
          <label className="block text-xs font-medium mb-1">Date Range</label>

          <DatePickerInput
            type="range"
            value={range}
            onChange={setRange}
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
      <div className="mt-2 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="dayKey"
              label={{ value: "Month / Day", position: "insideBottom", offset: -5 }}
            />

            <YAxis />
            <Tooltip />
            <Legend />

            {Object.keys(groupedByYear).map((year, i) => (
              <Line
                key={year}
                type="monotone"
                dataKey={year}
                name={`Year ${year}`}
                stroke={colors[i % colors.length]}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TABLE */}
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
            {visibleRows.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
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

        {/* Pagination */}
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
    </Card>
  );
}
