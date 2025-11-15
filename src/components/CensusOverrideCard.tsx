import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/store/AppContext";
import Card from "@/components/ui/Card";
import InfoButton from "@/components/ui/InfoButton";
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

import { DateRange } from "react-date-range";
import DateRangeHeader from "@/components/DateRangeHeader";

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

// --- Data type ---
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

  // ================================
  // KEEP SERIES
  // ================================
  const [selectedSeries, setSelectedSeries] = useState<string>("unit");
  const seriesOptions = ["facility", "unit"];

  // ================================
  // NEW: DATE RANGE (copied from MasterFilters)
  // ================================
  const [showCalendar, setShowCalendar] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // MasterFilters uses currentDate for month navigation
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleDateChange = (ranges: any) => {
    const sel = ranges.selection;
    setStartDate(sel.startDate);
    setEndDate(sel.endDate);
  };

  const formatDate = (d: any) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US");
  };

  // ================================
  // FILE UPLOAD (unchanged)
  // ================================
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

      const dateISO = excelSerialToUSDate(eventDate);
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

    setRows(parsed);
    updateData("demand", parsed);
  };

  // Load global if exists
  useEffect(() => {
    if (rows.length === 0 && Array.isArray(data?.demand) && data.demand.length > 0) {
      setRows(data.demand);
    }
  }, [data?.demand]);

  // ================================
  // NEW: Filter rows by StartDate → EndDate
  // ================================
  const filteredRows = useMemo(() => {
    if (!startDate || !endDate) return rows;

    return rows.filter((r) => {
      if (!r.date) return false;

      // Convert MM/DD/YYYY → YYYY-MM-DD for reliable comparison
      const normalized = r.date.replace(
        /(\d{2})\/(\d{2})\/(\d{4})/,
        "$3-$1-$2"
      );

      const d = new Date(normalized);
      return d >= startDate && d <= endDate;
    });
  }, [rows, startDate, endDate]);

  // Sync calendar month with selected start date
  useEffect(() => {
    if (startDate) {
      setCurrentDate(startDate);
    }
  }, [startDate]);

  // ================================
  // Pagination 
  // ================================
  const [page, setPage] = useState(1);
  const rowsPerPage = 24;

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage;
  const visibleRows = filteredRows.slice(startIdx, startIdx + rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // ================================
  // NEW: Chart data filtered by Start → End
  // ================================
  const chartData = useMemo(() => {
    if (!startDate || !endDate) return rows;

    return rows.filter((r) => {
      if (!r.date) return false;

      const normalized = r.date.replace(
        /(\d{2})\/(\d{2})\/(\d{4})/,
        "$3-$1-$2"
      );

      const d = new Date(normalized);
      return d >= startDate && d <= endDate;
    });
  }, [rows, startDate, endDate]);

  const colors = ["#4f46e5", "#22c55e", "#eab308", "#ef4444", "#06b6d4"];

  return (
    <Card className="p-4 space-y-4">
      
      {/* =======================
          DATE RANGE + SERIES
      ======================== */}
      <div className="flex flex-wrap gap-4 items-end">

        {/* SERIES */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Series
          </label>
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

        {/* DATE RANGE BUTTON */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Date Range
          </label>
          <button
            className="px-3 py-2 border rounded bg-white shadow-sm text-sm min-w-[220px] text-left"
            onClick={() => setShowCalendar(true)}
          >
            {startDate && endDate
              ? `${formatDate(startDate)} → ${formatDate(endDate)}`
              : "Select Date Range"}
          </button>
        </div>
      </div>

      {/* DATE RANGE MODAL */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center z-50 pt-32 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-[780px] animate-slideUp">

            <DateRangeHeader date={currentDate} setDate={setCurrentDate} />

            <DateRange
              ranges={[
                {
                  startDate: startDate || new Date(),
                  endDate: endDate || new Date(),
                  key: "selection",
                },
              ]}
              onChange={handleDateChange}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
              showMonthAndYearPickers={false}
              showMonthArrow={true}
              showDateDisplay={false}
            />

            <div className="flex justify-end mt-4 gap-3">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => setShowCalendar(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition"
                onClick={() => setShowCalendar(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="flex justify-between items-center mb-3 mt-6">
        <h3 className="text-lg font-semibold text-gray-800">Demand</h3>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="text-sm"
          aria-label="Upload demand Excel file"
        />
      </div>

      {/* =======================
          CHART
      ======================== */}
      <div className="mt-2 h-80">
        {rows.length === 0 ? (
          <p className="text-center text-gray-500 italic mt-10">
            ⚠️ No demand data available. Upload a file to visualize.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => {
                  if (!v) return "";
                  const parts = v.split("/");
                  return `${parts[0]}/${parts[1]}`;
                }}
                label={{
                  value: "Date",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                label={{
                  value: "Demand",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="demand_value"
                name="Demand"
                stroke="#4f46e5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* TABLE */}
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
              {visibleRows.map((row, i) => (
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

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages} ({filteredRows.length} total rows)
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
              >
                Next →
              </button>
            </div>
          )}
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
  );
}
