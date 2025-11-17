import { useState } from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/store/AppContext";

// Mantine date picker
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";

import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function MasterFilters() {
  const { master, setMaster } = useApp();

  const [loading, setLoading] = useState(false);

  // -----------------------------------------------------
  // FILE UPLOAD HANDLER
  // -----------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

    const facilities = Array.from(new Set(rows.map((r) => r.Facility))).filter(Boolean);
    const units = Array.from(new Set(rows.map((r) => r.Unit))).filter(Boolean);
    const functionalAreas = Array.from(
      new Set(rows.map((r) => r["Functional Area"]))
    ).filter(Boolean);

    setMaster((prev) => ({
      ...prev,
      options: { facilities, units, functionalAreas },
    }));

    setLoading(false);
  };

  // -----------------------------------------------------
  // UPDATE FILTERS
  // -----------------------------------------------------
  const updateFilter = (key: string, value: any) => {
    setMaster((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // -----------------------------------------------------
  // FORMAT DATE
  // -----------------------------------------------------
  const formatDate = (d: any) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US");
  };

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-300 px-6 py-4 shadow-sm">

      {/* TOP BAR */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-gray-800">Master Filters</div>

        <div className="flex gap-6 text-sm text-blue-600">
          <label className="cursor-pointer hover:underline">
            📁 Upload XLS/CSV
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>

          {loading && <span className="text-gray-500">Loading…</span>}

          <button className="hover:underline" onClick={() => window.location.reload()}>
            ↻ Refresh
          </button>

          <button
            className="hover:underline"
            onClick={() =>
              setMaster({
                facility: "",
                unit: "",
                functionalArea: "",
                startDate: "",
                endDate: "",
                options: master.options,
              })
            }
          >
            🧹 Reset
          </button>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="flex flex-wrap gap-4">

        {/* Facility */}
        <select
          aria-label="Select Facility"
          className="px-4 py-2 bg-white border rounded-lg shadow-sm"
          value={master.facility}
          onChange={(e) => updateFilter("facility", e.target.value)}
        >
          <option value="">Campus</option>
          {master.options.facilities.map((f, i) => (
            <option key={i} value={f}>
              {f}
            </option>
          ))}
        </select>

        {/* Functional Area */}
        <select
          aria-label="Select Functional Area"
          className="px-4 py-2 bg-white border rounded-lg shadow-sm"
          value={master.functionalArea}
          onChange={(e) => updateFilter("functionalArea", e.target.value)}
        >
          <option value="">Functional Area</option>
          {master.options.functionalAreas.map((fa, i) => (
            <option key={i} value={fa}>
              {fa}
            </option>
          ))}
        </select>

        {/* Unit */}
        <select
          aria-label="Select Unit"
          className="px-4 py-2 bg-white border rounded-lg shadow-sm"
          value={master.unit}
          onChange={(e) => updateFilter("unit", e.target.value)}
        >
          <option value="">Unit</option>
          {master.options.units.map((u, i) => (
            <option key={i} value={u}>
              {u}
            </option>
          ))}
        </select>

        {/* Mantine Date Range */}
        <div className="min-w-[260px]">
          <DatePickerInput
            type="range"
            value={[
              master.startDate ? new Date(master.startDate) : null,
              master.endDate ? new Date(master.endDate) : null,
            ]}
            onChange={(value) => {
              const [start, end] = value ?? [];
              setMaster((prev) => ({
                ...prev,
                startDate: start || "",
                endDate: end || "",
              }));
            }}
            placeholder="Select Date Range"
            numberOfColumns={2}
            mx="auto"
            size="md"
            className="w-full"
            styles={{
              input: {
                borderRadius: "8px",
                padding: "10px 14px",
                background: "white",
                border: "1px solid #d1d5db",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
