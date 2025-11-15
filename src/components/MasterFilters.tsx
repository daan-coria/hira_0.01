import { useState } from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/store/AppContext";
import { DateRange } from "react-date-range";
import DateRangeHeader from "./DateRangeHeader";

export default function MasterFilters() {
  const { master, setMaster } = useApp();

  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Calendar state (controls both months)
  const [currentDate, setCurrentDate] = useState(
    master.startDate ? new Date(master.startDate) : new Date()
  );

  // --------------------------------------
  // FILE UPLOAD
  // --------------------------------------
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
    const functionalAreas = Array.from(new Set(rows.map((r) => r["Functional Area"]))).filter(Boolean);

    setMaster((prev) => ({
      ...prev,
      options: {
        facilities,
        units,
        functionalAreas,
      },
    }));

    setLoading(false);
  };

  // --------------------------------------
  // UPDATE FILTERS
  // --------------------------------------
  const updateFilter = (key: string, value: any) => {
    setMaster((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // --------------------------------------
  // UPDATE DATE RANGE
  // --------------------------------------
  const handleDateChange = (ranges: any) => {
    const sel = ranges.selection;
    setMaster((prev) => ({
      ...prev,
      startDate: sel.startDate,
      endDate: sel.endDate,
    }));
  };

  // --------------------------------------
  // FORMAT DATE
  // --------------------------------------
  const formatDate = (d: any) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US");
  };

  // --------------------------------------
  // RENDER
  // --------------------------------------
  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-300 px-6 py-4 shadow-sm">

      {/* TOP BAR --------------------------------------------------- */}
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

      {/* FILTER ROW ------------------------------------------------ */}
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

        {/* Date Button */}
        <button
          aria-label="Select Date Range"
          className="px-4 py-2 bg-white border rounded-lg shadow-sm min-w-[220px] text-left"
          onClick={() => setShowCalendar(true)}
        >
          {master.startDate && master.endDate
            ? `${formatDate(master.startDate)} → ${formatDate(master.endDate)}`
            : "Select Date Range"}
        </button>
      </div>

      {/* DATE RANGE MODAL ------------------------------------------------ */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm 
                        flex items-start justify-center 
                        z-50 pt-32 animate-fadeIn">

          <div className="bg-white rounded-xl shadow-xl border border-gray-200 
                          p-6 w-[780px] animate-slideUp">

            <DateRangeHeader date={currentDate} setDate={setCurrentDate} />

            <DateRange
              key={currentDate.toISOString()}
              ranges={[{
                startDate: master.startDate ? new Date(master.startDate) : new Date(),
                endDate: master.endDate ? new Date(master.endDate) : new Date(),
                key: "selection",
              }]}
              onChange={handleDateChange}
              moveRangeOnFirstSelection={false}
              months={2}
              month={currentDate}
              direction="horizontal"
              showMonthAndYearPickers={false}
              showMonthArrow={false}
              showDateDisplay={false}
              staticRanges={[]}
              inputRanges={[]}
              className="!shadow-none !border-none rounded-lg"
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

    </div>
  );
}
