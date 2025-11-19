import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import * as XLSX from "xlsx";
import { GripVertical, Plus, Trash2, Upload } from "lucide-react";

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
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
  sortOrder: number; 
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


// -----------------------
// CAMPUS NORMALIZATION
// -----------------------

function normalizeCampusName(raw: string): string {
  if (!raw) return "";

  const input = String(raw).trim().toLowerCase();

  let stored: { key: string; name: string; region?: string }[] = [];

  try {
    const ls = localStorage.getItem("hira_campuses");
    if (ls) stored = JSON.parse(ls);
  } catch {
    return raw; // fallback
  }

  if (!stored.length) return raw;

  // 1) Exact name match
  const exactName = stored.find(
    (c) => c.name.trim().toLowerCase() === input
  );
  if (exactName) return exactName.name;

  // 2) Key match (“LANS”, “MAC”, etc.)
  const exactKey = stored.find(
    (c) => c.key.trim().toLowerCase() === input
  );
  if (exactKey) return exactKey.name;

  // 3) Fuzzy: input contains part of name (“lansing” → “Lansing Campus”)
  const fuzzyName = stored.find((c) =>
    input.includes(c.name.trim().toLowerCase())
  );
  if (fuzzyName) return fuzzyName.name;

  // 4) Fuzzy: input contains part of key (“lans” → “Lansing Campus”)
  const fuzzyKey = stored.find((c) =>
    input.includes(c.key.trim().toLowerCase())
  );
  if (fuzzyKey) return fuzzyKey.name;

  // 5) If no match found → notify user once
  console.warn("⚠ Unknown campus in Excel:", raw);
  window.alert(
    `WARNING: Campus "${raw}" does not match any campus in Health System Setup.\n\n` +
      `It will be imported as-is.`
  );

  return raw; // fallback
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
      campus: normalizeCampusName(String(facility ?? "")),
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
  floatPoolRows,
  unitOfServiceOptions,
  onUpdateRow,
  onDeleteRow,
  onFunctionalAreaChange,
  onUnitGroupingChange,
  onPoolParticipationChange,
  onUnitOfServiceChange,
}: {
  row: FacilityRow;
  campusOptions: string[];
  functionalAreas: string[];
  unitGroupings: string[];
  floatPoolRows: FacilityRow[];
  unitOfServiceOptions: string[];
  onUpdateRow: (id: number, patch: Partial<FacilityRow>) => void;
  onDeleteRow: (id: number) => void;
  onFunctionalAreaChange: (row: FacilityRow, value: string) => void;
  onUnitGroupingChange: (row: FacilityRow, value: string) => void;
  onPoolParticipationChange: (
    row: FacilityRow,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  onUnitOfServiceChange: (row: FacilityRow, value: string) => void;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
  });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: transition || undefined,
    // Performance optimizations
    willChange: transform ? "transform" : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  // Helper: campus lists
  const rowCampuses = row.campus ? row.campus.split("|").filter(Boolean) : [];

  // Float pool options limited to same campus
  const availableFloatPools = floatPoolRows.filter((pool) => {
    if (!pool.isFloatPool) return false;
    if (pool.id === row.id) return false;

    const poolCampuses = pool.campus
      ? pool.campus.split("|").filter(Boolean)
      : [];

    if (rowCampuses.length === 0 || poolCampuses.length === 0) return false;

    return poolCampuses.some((c) => rowCampuses.includes(c));
  });

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t last:border-b-0 hover:bg-gray-50"
    >
      {/* drag handle - ONLY place with drag listeners */}
      <td
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="border px-2 py-1 text-center select-none cursor-grab active:cursor-grabbing text-gray-500 hover:bg-gray-100"
      >
        ☰
      </td>

      {/* Cost Center Key */}
      <td className="px-3 py-2 align-middle">
        <Input
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
        {row.isFloatPool ? (
          // FLOAT POOL → multi-campus checkbox list
          <div className="max-h-24 overflow-y-auto border rounded-xl p-2 space-y-1">
            {campusOptions.map((camp) => {
              const selected = rowCampuses.includes(camp);
              return (
                <label
                  key={camp}
                  className="flex items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = new Set(rowCampuses);
                      if (current.has(camp)) {
                        current.delete(camp);
                      } else {
                        current.add(camp);
                      }
                      const updated = Array.from(current).join("|");
                      onUpdateRow(row.id, { campus: updated });
                    }}
                  />
                  {camp}
                </label>
              );
            })}
          </div>
        ) : campusOptions.length ? (
          // NON FLOAT → single-select dropdown
          <Select
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
          aria-label="Functional Area"
          value={row.functionalArea}
          onChange={(e) => onFunctionalAreaChange(row, e.target.value)}
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
          aria-label="Unit Grouping"
          value={row.unitGrouping}
          onChange={(e) => onUnitGroupingChange(row, e.target.value)}
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
        ) : availableFloatPools.length === 0 ? (
          <div className="text-xs text-gray-400">
            No float pools for this campus
          </div>
        ) : (
          <select
            id={`poolParticipation-${row.id}`}
            aria-label="Pool Participation"
            multiple
            className="w-full rounded-xl border border-gray-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={row.poolParticipation}
            onChange={(e) => onPoolParticipationChange(row, e)}
          >
            {availableFloatPools
              .map((pool) => pool.costCenterName || pool.costCenterKey)
              .filter(Boolean)
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
            aria-label="Unit of Service"
            id={`unitOfService-${row.id}`}
            value={row.unitOfService}
            onChange={(e) => onUnitOfServiceChange(row, e.target.value)}
          >
            <option value="">Select UOS</option>
            {unitOfServiceOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            <option value="__add_new__">+ Add new UOS</option>
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
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}


  const MemoFacilityRowItem = memo(FacilityRowItem)

// -----------------------
// MAIN COMPONENT
// -----------------------

export default function CampusSetup() {
  const { data, updateData } = useApp();

  const [rows, setRows] = useState<FacilityRow[]>([]);
  const [functionalAreas, setFunctionalAreas] = useState<string[]>([]);
  const [unitGroupings, setUnitGroupings] = useState<string[]>([]);
  const [campusOptions, setCampusOptions] = useState<string[]>([]);
  const [unitOfServiceOptions, setUnitOfServiceOptions] = useState<string[]>([
    "Patient Days",
    "Visits",
    "Procedures",
    "Other",
  ]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

 // -----------------------
  // TABLE FILTERS
  // -----------------------

  const [filterUnitGroup, setFilterUnitGroup] = useState("");
  const [filterFloatPool, setFilterFloatPool] = useState("");
  const [showMissing, setShowMissing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Configure sensors for drag and drop - require 8px movement before drag starts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Campus Setup");

    XLSX.writeFile(workbook, "campus_setup.xlsx");
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
        console.error("Error loading campus setup", err);
      }
    }

    if (initial.length > 0) {
      initial = normalizeSortOrder(initial);
      setRows(initial);

      setFunctionalAreas(
        Array.from(
          new Set(initial.map((r) => r.functionalArea).filter(Boolean))
        )
      );

      setUnitGroupings(
        Array.from(
          new Set(initial.map((r) => r.unitGrouping).filter(Boolean))
        )
      );

      // Add any existing UOS values into the options list
      setUnitOfServiceOptions((prev) => {
        const fromRows = Array.from(
          new Set(initial.map((r) => r.unitOfService).filter(Boolean))
        ) as string[];
        const merged = new Set(prev);
        fromRows.forEach((v) => merged.add(v));
        return Array.from(merged);
      });
    }
  }, [data]);

  // -----------------------
  // PERSIST TO LS + CONTEXT
  // -----------------------

  useEffect(() => {
    const normalized = normalizeSortOrder(rows);

    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      updateData("facilitySetup", normalized);
      try {
        localStorage.setItem(
          STORAGE_KEY_FACILITY_SETUP,
          JSON.stringify(normalized)
        );
      } catch (err) {
        console.error("Error saving campus setup", err);
      }
    }, 300) as unknown as number;

    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, [rows, updateData]);

  // -----------------------
  // DERIVED DATA
  // -----------------------

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.sortOrder - b.sortOrder),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return sortedRows.filter((r) => {
      // Unit Grouping
      if (filterUnitGroup && r.unitGrouping !== filterUnitGroup) return false;

      // Float Pool
      if (filterFloatPool === "yes" && !r.isFloatPool) return false;
      if (filterFloatPool === "no" && r.isFloatPool) return false;

      // Show only incomplete rows
      if (showMissing) {
        const missing =
          !r.costCenterKey ||
          !r.costCenterName ||
          !r.campus ||
          !r.functionalArea ||
          (!r.isFloatPool &&
            (r.capacity === "" ||
              r.capacity === null ||
              r.capacity === undefined)) ||
          (!r.isFloatPool && !r.unitOfService);
        if (!missing) return false;
      }

      return true;
    });
  }, [sortedRows, filterUnitGroup, filterFloatPool, showMissing]);

  const floatPoolRows = useMemo(
    () => rows.filter((r) => r.isFloatPool),
    [rows]
  );

  // -----------------------
  // UPDATE HELPERS
  // -----------------------

  const normalizeRow = useCallback((row: FacilityRow): FacilityRow => {
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
  }, []);

  const updateRow = useCallback(
    (id: number, patch: Partial<FacilityRow>) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? normalizeRow({ ...r, ...patch }) : r
        )
      );
    },
    [normalizeRow]
  );

  const addRow = useCallback(() => {
    setRows((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1;
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
        sortOrder: prev.length + 1,
      };
      return [...prev, row];
    });
  }, []);

  const deleteRow = useCallback((id: number) => {
    setRows((prev) => normalizeSortOrder(prev.filter((r) => r.id !== id)));
  }, []);

  const clearAll = useCallback(() => {
    if (!window.confirm("Clear all cost centers from Facility Set-up?")) return;
    setRows([]);
  }, []);

  // -----------------------
  // EXCEL UPLOAD
  // -----------------------

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rowsRaw = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      }) as any[];

      const parsed = parseExcelToRows(rowsRaw);
      const normalized = normalizeSortOrder(parsed);

      setRows(normalized);

      setFunctionalAreas(
        Array.from(
          new Set(normalized.map((r) => r.functionalArea).filter(Boolean))
        )
      );
    } catch (err) {
      console.error("Error parsing campus setup Excel", err);
      window.alert("Error reading the Excel file. Please check the format.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // -----------------------
  // DND-KIT – DRAG HANDLERS
  // -----------------------

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setIsDragging(false);

    if (!over || active.id === over.id) return;

    // Use requestAnimationFrame to defer the update and reduce reflow violations
    requestAnimationFrame(() => {
      setRows((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id);
        const newIndex = prev.findIndex((r) => r.id === over.id);
        const newRows = arrayMove(prev, oldIndex, newIndex);

        return newRows.map((r, i) => ({
          ...r,
          sortOrder: i + 1,
        }));
      });
    });
  };

  // -----------------------
  // NEW FUNCTIONAL AREA
  // -----------------------

  const handleFunctionalAreaChange = useCallback(
    (row: FacilityRow, value: string) => {
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
    },
    [updateRow]
  );

  // -----------------------
  // NEW UNIT GROUPING
  // -----------------------

  const handleUnitGroupingChange = useCallback(
    (row: FacilityRow, value: string) => {
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
    },
    [updateRow]
  );

  // -----------------------
  // POOL PARTICIPATION
  // -----------------------

  const handlePoolParticipationChange = useCallback(
    (row: FacilityRow, e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected: string[] = [];
      const options = e.target.options;
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (opt.selected && opt.value) selected.push(opt.value);
      }
      updateRow(row.id, { poolParticipation: selected });
    },
    [updateRow]
  );

  // -----------------------
  // UNIT OF SERVICE CHANGE
  // -----------------------

  const handleUnitOfServiceChange = useCallback(
    (row: FacilityRow, value: string) => {
      if (value === "__add_new__") {
        const name = window.prompt("New Unit of Service?");
        if (name && name.trim()) {
          const trimmed = name.trim();
          setUnitOfServiceOptions((prev) =>
            prev.includes(trimmed) ? prev : [...prev, trimmed]
          );
          updateRow(row.id, { unitOfService: trimmed });
        }
      } else {
        updateRow(row.id, { unitOfService: value });
      }
    },
    [updateRow]
  );

  // -----------------------
  // RENDER
  // -----------------------

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Campus Set-up</h2>

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

      {/* FILTER BAR */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* *Campus Filter and Functional Area Filter will be driven by Master Filters* */}

          {/* Unit Group Filter */}
          <Select
            aria-label="Filter by Unit Grouping"
            value={filterUnitGroup}
            onChange={(e) => setFilterUnitGroup(e.target.value)}
          >
            <option value="">All Unit Groups</option>
            {unitGroupings.map((ug) => (
              <option key={ug} value={ug}>
                {ug}
              </option>
            ))}
          </Select>

          {/* Float Pool Filter */}
          <Select
            aria-label="Filter by Float Pool"
            value={filterFloatPool}
            onChange={(e) => setFilterFloatPool(e.target.value)}
          >
            <option value="">Float Pool: All</option>
            <option value="yes">Float Pools Only</option>
            <option value="no">Non-Float Units Only</option>
          </Select>
        </div>

        {/* SHOW ONLY ROWS WITH MISSING VALUES */}
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showMissing}
            onChange={(e) => setShowMissing(e.target.checked)}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
          />
          <span className="text-gray-700">Show only incomplete rows</span>
        </label>
      </Card>

      {/* TABLE */}
      <Card className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedRows.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="min-w-full text-sm table-fixed">
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
                {filteredRows.map((row) => (
                  <MemoFacilityRowItem
                    key={row.id}
                    row={row}
                    campusOptions={campusOptions}
                    functionalAreas={functionalAreas}
                    unitGroupings={unitGroupings}
                    floatPoolRows={floatPoolRows}
                    unitOfServiceOptions={unitOfServiceOptions}
                    onUpdateRow={updateRow}
                    onDeleteRow={deleteRow}
                    onFunctionalAreaChange={handleFunctionalAreaChange}
                    onUnitGroupingChange={handleUnitGroupingChange}
                    onPoolParticipationChange={handlePoolParticipationChange}
                    onUnitOfServiceChange={handleUnitOfServiceChange}
                  />
                ))}

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