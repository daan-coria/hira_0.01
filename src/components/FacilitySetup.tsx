import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { GripVertical, Plus, Trash2, Upload } from "lucide-react";

import {
  DndContext,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { useApp } from "@/store/AppContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

// -----------------------
// Types
// -----------------------

type FacilityRow = {
  id: number;
  costCenterKey: string;
  costCenterName: string;
  campus: string;
  functionalArea: string;
  unitGrouping: string;
  capacity: number | "" | "N/A";
  isFloatPool: boolean;
  poolParticipation: string[];
  unitOfService: string;
  sortOrder: number; // internal only for dnd
};

type Campus = {
  key: string;
  name: string;
  region: string;
};

const STORAGE_KEY_FACILITY_SETUP = "hira_facilitySetup";
const STORAGE_KEY_CAMPUSES = "hira_campuses";

// -----------------------
// Excel helpers
// -----------------------

function normalizeHeaders(row: any): Record<string, any> {
  return Object.keys(row).reduce((acc: any, key) => {
    acc[key.trim().toLowerCase()] = row[key];
    return acc;
  }, {});
}

function parseExcelToRows(rawRows: any[]): FacilityRow[] {
  return rawRows.map((raw, index) => {
    const keys = normalizeHeaders(raw);

    const facility = keys["facility"] ?? "";
    const unit = keys["unit"] ?? "";
    const functionalArea =
      keys["functional area"] ?? keys["functional_area"] ?? "";
    const costCenter =
      keys["cost center"] ??
      keys["cost_center"] ??
      keys["cost centre"] ??
      "";
    const capacityRaw = keys["capacity"] ?? "";

    let capacity: number | "" = "";
    if (capacityRaw !== "" && capacityRaw != null && !Number.isNaN(capacityRaw)) {
      const n = Number(capacityRaw);
      if (Number.isFinite(n)) capacity = n;
    }

    const sortOrder = index + 1;

    return {
      id: sortOrder,
      costCenterKey: String(costCenter ?? ""),
      costCenterName: String(unit ?? ""),
      campus: String(facility ?? ""),
      functionalArea: String(functionalArea ?? ""),
      unitGrouping: "",
      capacity,
      isFloatPool: false,
      poolParticipation: [],
      unitOfService: "",
      sortOrder,
    };
  });
}

function normalizeSortOrder(rows: FacilityRow[]): FacilityRow[] {
  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r, i) => ({ ...r, sortOrder: i + 1 }));
}

// -----------------------
// Sortable Row Component
// -----------------------

function FacilityRowItem({
  row,
  campusOptions,
  functionalAreas,
  unitGroupings,
  floatPoolOptions,
  onUpdateRow,
  onDeleteRow,
  onFunctionalAreaChange,
  onUnitGroupingChange,
  onPoolParticipationChange,
}: {
  row: FacilityRow;
  campusOptions: string[];
  functionalAreas: string[];
  unitGroupings: string[];
  floatPoolOptions: string[];
  onUpdateRow: (id: number, patch: Partial<FacilityRow>) => void;
  onDeleteRow: (id: number) => void;
  onFunctionalAreaChange: (row: FacilityRow, value: string) => void;
  onUnitGroupingChange: (row: FacilityRow, value: string) => void;
  onPoolParticipationChange: (
    row: FacilityRow,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: transition || undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}   // use the computed style ONLY
      className="border-t last:border-b-0 hover:bg-gray-50"
    >

        {/* drag handle */}
                  <td
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    className="border px-2 py-1 text-center select-none cursor-grab text-gray-500"
                  >
                    ☰
                  </td>

        {/* Cost Center Key */}
        <td className="px-3 py-2 align-middle">
          <Input
            onPointerDown={(e) => e.stopPropagation()}
            id={`costCenterKey-${row.id}`}
            aria-label="Cost Center Key"
            value={row.costCenterKey}
            onChange={(e) =>
              onUpdateRow(row.id, { costCenterKey: e.target.value })
            }
            placeholder="e.g., 5W"
          />
        </td>

        {/* Cost Center Name */}
        <td className="px-3 py-2 align-middle">
          <Input
            onPointerDown={(e) => e.stopPropagation()}
            id={`costCenterName-${row.id}`}
            aria-label="Cost Center Name"
            value={row.costCenterName}
            onChange={(e) =>
              onUpdateRow(row.id, { costCenterName: e.target.value })
            }
            placeholder="e.g., Med/Surg"
          />
        </td>

        {/* Campus */}
        <td className="px-3 py-2 align-middle">
          {campusOptions.length ? (
            <Select
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Campus"
              value={row.campus}
              onChange={(e) =>
                onUpdateRow(row.id, { campus: e.target.value })
              }
            >
              <option value="">Select campus</option>
              {campusOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              onPointerDown={(e) => e.stopPropagation()}
              id={`campus-${row.id}`}
              aria-label="Campus"
              value={row.campus}
              onChange={(e) =>
                onUpdateRow(row.id, { campus: e.target.value })
              }
              placeholder="Campus"
            />
          )}
        </td>

        {/* Functional Area */}
        <td className="px-3 py-2 align-middle">
          <Select
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Functional Area"
            value={row.functionalArea}
            onChange={(e) =>
              onFunctionalAreaChange(row, e.target.value)
            }
          >
            <option value="">Select functional area</option>
            {functionalAreas.map((fa) => (
              <option key={fa} value={fa}>
                {fa}
              </option>
            ))}
            <option value="__add_new__">+ Add new functional area</option>
          </Select>
        </td>

        {/* Unit Grouping */}
        <td className="px-3 py-2 align-middle">
          <Select
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Unit Grouping"
            value={row.unitGrouping}
            onChange={(e) =>
              onUnitGroupingChange(row, e.target.value)
            }
          >
            <option value="">No unit grouping</option>
            {unitGroupings.map((ug) => (
              <option key={ug} value={ug}>
                {ug}
              </option>
            ))}
            <option value="__add_new__">+ Add new unit grouping</option>
          </Select>
        </td>

        {/* Capacity */}
        <td className="px-3 py-2 align-middle">
          {row.isFloatPool ? (
            <div className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-100 rounded-xl">
              N/A
            </div>
          ) : (
            <Input
              onPointerDown={(e) => e.stopPropagation()}
              id={`capacity-${row.id}`}
              aria-label="Capacity"
              type="number"
              min={0}
              value={row.capacity === "" ? "" : String(row.capacity)}
              onChange={(e) =>
                onUpdateRow(row.id, {
                  capacity:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              placeholder="Capacity"
            />
          )}
        </td>
              {/* Float Pool Toggle */}
        <td className="px-3 py-2 align-middle">
          <label
            htmlFor={`isFloatPool-${row.id}`}
            className="inline-flex items-center cursor-pointer"
          >
            <input
              onPointerDown={(e) => e.stopPropagation()}
              id={`isFloatPool-${row.id}`}
              aria-label="Float Pool"
              type="checkbox"
              className="sr-only peer"
              checked={row.isFloatPool}
              onChange={(e) =>
                onUpdateRow(row.id, { isFloatPool: e.target.checked })
              }
            />
            <div className="relative h-5 w-10 rounded-full bg-gray-200 peer-checked:bg-emerald-500 transition-colors">
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </td>

        {/* Pool Participation */}
        <td className="px-3 py-2 align-middle">
          {row.isFloatPool ? (
            <div className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-100 rounded-xl">
              N/A
            </div>
          ) : floatPoolOptions.length === 0 ? (
            <div className="text-xs text-gray-400">
              No float pools defined
            </div>
          ) : (
            <select
              onPointerDown={(e) => e.stopPropagation()}
              id={`poolParticipation-${row.id}`}
              aria-label="Pool Participation"
              multiple
              className="w-full rounded-xl border border-gray-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={row.poolParticipation}
              onChange={(e) => onPoolParticipationChange(row, e)}
            >
              {floatPoolOptions
                .filter(
                  (name) =>
                    name !== (row.costCenterName || row.costCenterKey)
                )
                .map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
            </select>
          )}
        </td>

        {/* Unit of Service */}
        <td className="px-3 py-2 align-middle">
          {row.isFloatPool ? (
            <div className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-100 rounded-xl">
              N/A
            </div>
          ) : (
            <Select
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Unit of Service"
              id={`unitOfService-${row.id}`}
              value={row.unitOfService}
              onChange={(e) =>
                onUpdateRow(row.id, { unitOfService: e.target.value })
              }
            >
              <option value="">Select UOS</option>
              <option value="Patient Days">Patient Days</option>
              <option value="Visits">Visits</option>
              <option value="Procedures">Procedures</option>
              <option value="Other">Other</option>
            </Select>
          )}
        </td>

        {/* Delete */}
        <td className="px-3 py-2 align-middle text-right">
          <button
            type="button"
            onClick={() => onDeleteRow(row.id)}
            className="inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Delete row"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>

        </tr>
    );
}

// -----------------------
// MAIN COMPONENT
// -----------------------

export default function FacilitySetup() {
  const { data, updateData } = useApp();

  const [rows, setRows] = useState<FacilityRow[]>([]);
  const [functionalAreas, setFunctionalAreas] = useState<string[]>([]);
  const [unitGroupings, setUnitGroupings] = useState<string[]>([]);
  const [campusOptions, setCampusOptions] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -----------------------
  // EXPORT CSV
  // -----------------------
  const handleExportCSV = () => {
    const headers = [
      "Cost Center Key",
      "Cost Center Name",
      "Campus",
      "Functional Area",
      "Unit Grouping",
      "Capacity",
      "Is Float Pool",
      "Pool Participation",
      "Unit of Service",
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.costCenterKey,
          r.costCenterName,
          r.campus,
          r.functionalArea,
          r.unitGrouping,
          r.capacity === "" ? "" : r.capacity,
          r.isFloatPool ? "TRUE" : "FALSE",
          r.poolParticipation.join("|"),
          r.unitOfService,
        ]
          .map((v) => `"${v ?? ""}"`)
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "facility_setup.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // -----------------------
  // EXPORT EXCEL
  // -----------------------
  const handleExportExcel = () => {
    const exportRows = rows.map((r) => ({
      "Cost Center Key": r.costCenterKey,
      "Cost Center Name": r.costCenterName,
      Campus: r.campus,
      "Functional Area": r.functionalArea,
      "Unit Grouping": r.unitGrouping,
      Capacity: r.capacity,
      "Is Float Pool": r.isFloatPool ? "TRUE" : "FALSE",
      "Pool Participation": r.poolParticipation.join("|"),
      "Unit of Service": r.unitOfService,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facility Setup");

    XLSX.writeFile(workbook, "facility_setup.xlsx");
  };

  // -----------------------
  // INITIAL LOAD (context + LS)
  // -----------------------

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CAMPUSES);
      if (stored) {
        const parsed = JSON.parse(stored) as Campus[];
        const names = Array.from(new Set(parsed.map((c) => c.name))).sort();
        setCampusOptions(names);
      }
    } catch (err) {
      console.error("Error loading campuses", err);
    }

    let initial: FacilityRow[] = [];

    if ((data as any)?.facilitySetup && Array.isArray((data as any).facilitySetup)) {
      initial = (data as any).facilitySetup as FacilityRow[];
    } else {
      try {
        const storedSetup = localStorage.getItem(STORAGE_KEY_FACILITY_SETUP);
        if (storedSetup) initial = JSON.parse(storedSetup) as FacilityRow[];
      } catch (err) {
        console.error("Error loading facility setup", err);
      }
    }

    if (initial.length > 0) {
      initial = normalizeSortOrder(initial);
      setRows(initial);

      setFunctionalAreas(
        Array.from(new Set(initial.map((r) => r.functionalArea).filter(Boolean)))
      );

      setUnitGroupings(
        Array.from(new Set(initial.map((r) => r.unitGrouping).filter(Boolean)))
      );
    }
  }, [data]);

  // -----------------------
  // PERSIST TO LS + CONTEXT
  // -----------------------

  useEffect(() => {
    const normalized = normalizeSortOrder(rows);
    updateData("facilitySetup", normalized);
    try {
      localStorage.setItem(STORAGE_KEY_FACILITY_SETUP, JSON.stringify(normalized));
    } catch (err) {
      console.error("Error saving facility setup", err);
    }
  }, [rows, updateData]);

  // -----------------------
  // DERIVED DATA
  // -----------------------

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.sortOrder - b.sortOrder),
    [rows]
  );

  const floatPoolOptions = useMemo(
    () =>
      rows
        .filter((r) => r.isFloatPool)
        .map((r) => r.costCenterName || r.costCenterKey)
        .filter(Boolean),
    [rows]
  );

  // -----------------------
  // UPDATE HELPERS
  // -----------------------

  const normalizeRow = (row: FacilityRow): FacilityRow => {
    if (row.isFloatPool) {
      return {
        ...row,
        capacity: "N/A",
        poolParticipation: [],
        unitOfService: "N/A",
      };
    }
    if (row.capacity === "N/A") row.capacity = "";
    if (row.unitOfService === "N/A") row.unitOfService = "";
    return row;
  };

  const updateRow = (id: number, patch: Partial<FacilityRow>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? normalizeRow({ ...r, ...patch }) : r
      )
    );
  };

  const addRow = () => {
    const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;

    const row: FacilityRow = {
      id: nextId,
      costCenterKey: "",
      costCenterName: "",
      campus: "",
      functionalArea: "",
      unitGrouping: "",
      capacity: "",
      isFloatPool: false,
      poolParticipation: [],
      unitOfService: "",
      sortOrder: rows.length + 1,
    };

    setRows((prev) => [...prev, row]);
  };

  const deleteRow = (id: number) => {
    setRows((prev) => normalizeSortOrder(prev.filter((r) => r.id !== id)));
  };

  const clearAll = () => {
    if (!window.confirm("Clear all cost centers from Facility Set-up?")) return;
    setRows([]);
  };

  // -----------------------
  // EXCEL UPLOAD
  // -----------------------

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

      const parsed = parseExcelToRows(rowsRaw);
      const normalized = normalizeSortOrder(parsed);

      setRows(normalized);

      setFunctionalAreas(
        Array.from(new Set(normalized.map((r) => r.functionalArea).filter(Boolean)))
      );
    } catch (err) {
      console.error("Error parsing facility setup Excel", err);
      window.alert("Error reading the Excel file. Please check the format.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


    // -----------------------
  // DND-KIT — DRAG END (REORDER)
  // -----------------------

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((prev) => {
      const oldIndex = prev.findIndex((r) => r.id === active.id);
      const newIndex = prev.findIndex((r) => r.id === over.id);
      const newRows = arrayMove(prev, oldIndex, newIndex);

      return newRows.map((r, i) => ({
        ...r,
        sortOrder: i + 1,
      }));
    });
  };

  // -----------------------
  // NEW FUNCTIONAL AREA
  // -----------------------

  const handleFunctionalAreaChange = (row: FacilityRow, value: string) => {
    if (value === "__add_new__") {
      const name = window.prompt("New functional area name?");
      if (name && name.trim()) {
        const trimmed = name.trim();
        setFunctionalAreas((prev) =>
          prev.includes(trimmed) ? prev : [...prev, trimmed]
        );
        updateRow(row.id, { functionalArea: trimmed });
      }
    } else {
      updateRow(row.id, { functionalArea: value });
    }
  };

  // -----------------------
  // NEW UNIT GROUPING
  // -----------------------

  const handleUnitGroupingChange = (row: FacilityRow, value: string) => {
    if (value === "__add_new__") {
      const name = window.prompt("New unit grouping name?");
      if (name && name.trim()) {
        const trimmed = name.trim();
        setUnitGroupings((prev) =>
          prev.includes(trimmed) ? prev : [...prev, trimmed]
        );
        updateRow(row.id, { unitGrouping: trimmed });
      }
    } else {
      updateRow(row.id, { unitGrouping: value });
    }
  };

  // -----------------------
  // POOL PARTICIPATION
  // -----------------------

  const handlePoolParticipationChange = (
    row: FacilityRow,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selected: string[] = [];
    const options = e.target.options;
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (opt.selected && opt.value) selected.push(opt.value);
    }
    updateRow(row.id, { poolParticipation: selected });
  };

  // -----------------------
  // RENDER
  // -----------------------

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Facility Set-up</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Upload Excel */}
          <input
            aria-label="Upload Excel"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Excel"}
          </Button>

          {/* Export CSV */}
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          {/* Export Excel */}
          <Button
            variant="ghost"
            className="border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>

          {/* Clear All */}
          <Button
            variant="ghost"
            className="border border-red-300 text-red-600 hover:bg-red-50"
            onClick={clearAll}
          >
            Clear All
          </Button>

          {/* Add Row */}
          <Button
            variant="ghost"
            className="border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={addRow}
          >
            <Plus className="w-4 h-4" />
            Add Cost Center
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card className="overflow-x-auto">
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedRows.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-600">
                  <th className="w-8 px-2 py-2" />
                  <th className="px-3 py-2 text-left">Cost Center Key</th>
                  <th className="px-3 py-2 text-left">Cost Center Name</th>
                  <th className="px-3 py-2 text-left">Campus</th>
                  <th className="px-3 py-2 text-left">Functional Area</th>
                  <th className="px-3 py-2 text-left">Unit Grouping</th>
                  <th className="px-3 py-2 text-left">Capacity</th>
                  <th className="px-3 py-2 text-left">Float Pool</th>
                  <th className="px-3 py-2 text-left">Pool Participation</th>
                  <th className="px-3 py-2 text-left">Unit of Service</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>

              <tbody>
                {sortedRows.map((row) => (
                  <FacilityRowItem
                    key={row.id}
                    row={row}
                    campusOptions={campusOptions}
                    functionalAreas={functionalAreas}
                    unitGroupings={unitGroupings}
                    floatPoolOptions={floatPoolOptions}
                    onUpdateRow={updateRow}
                    onDeleteRow={deleteRow}
                    onFunctionalAreaChange={handleFunctionalAreaChange}
                    onUnitGroupingChange={handleUnitGroupingChange}
                    onPoolParticipationChange={handlePoolParticipationChange}
                  />
                ))}
\\
                {sortedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-3 py-6 text-center text-sm text-gray-400"
                    >
                      No cost centers defined yet. Upload an Excel file or add a
                      cost center manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </Card>
    </div>
  );
}
