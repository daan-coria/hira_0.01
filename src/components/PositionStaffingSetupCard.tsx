import {
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
} from "react";
import { useApp } from "@/store/AppContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type StaffingRow = {
  id: string;
  unitName: string;
  departmentName?: string;
  active: boolean;
  resourceType: "Nurse" | "NA/UC";
  minStaffing: string;
  minThreshold: string;
  ratio: string;
  maxRatio: string;
  fixed: string;
  shiftKey: string;
};

type SnapshotShift = {
  id?: string | number;
  key?: string;
  name?: string;
  shift_name?: string;
  display_name?: string;
};

export default function PositionStaffingSetupCard() {
  const { getFrontendSnapshot } = useApp();

  // -------------------------
  // Pull data from snapshot
  // -------------------------
  const snapshot: any = useMemo(
    () => (typeof getFrontendSnapshot === "function" ? getFrontendSnapshot() : {}),
    [getFrontendSnapshot]
  );

  const healthSystem = snapshot?.healthSystem ?? {};
  const facilitySummary = snapshot?.facilitySummary ?? {};
  const shifts: SnapshotShift[] = Array.isArray(snapshot?.shifts)
    ? snapshot.shifts
    : [];

  // -------------------------
  // Derive units (5E ICU, 5W, 6E, ...)
  // -------------------------
  const unitNames: string[] = useMemo(() => {
    const rows: any[] =
      facilitySummary?.rows ??
      facilitySummary?.units ??
      facilitySummary?.data ??
      [];

    const names = rows
      .map((r) => {
        // Try several common keys; fall back to cost center name
        return (
          r.unitGrouping ||
          r.unit_name ||
          r.unit ||
          r.departmentName ||
          r.department ||
          r.functionalArea ||
          r.costCenterName ||
          r.name ||
          ""
        );
      })
      .filter(Boolean);

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [facilitySummary]);

  // -------------------------
  // Shift options from snapshot.shifts
  // -------------------------
  const shiftOptions = useMemo(
    () =>
      shifts.map((s) => {
        const label =
          s.display_name ||
          s.shift_name ||
          s.name ||
          String(s.id ?? s.key ?? "Shift");
        const value = String(s.id ?? s.key ?? label);
        return { label, value };
      }),
    [shifts]
  );

  // -------------------------
  // Initial rows: one per unit
  // -------------------------
  const [rows, setRows] = useState<StaffingRow[]>([]);

  useEffect(() => {
    if (!unitNames.length) {
      setRows([]);
      return;
    }

    setRows((prev) => {
      // Keep any existing row editing state if unit already exists
      const byId = new Map(prev.map((r) => [r.id, r]));

      const next: StaffingRow[] = unitNames.map((unitName) => {
        const id = unitName;
        const existing = byId.get(id);
        if (existing) return existing;

        return {
          id,
          unitName,
          departmentName: unitName,
          active: false,
          resourceType: "Nurse",
          minStaffing: "",
          minThreshold: "",
          ratio: "",
          maxRatio: "",
          fixed: "",
          shiftKey: shiftOptions[0]?.value ?? "",
        };
      });

      return next;
    });
  }, [unitNames, shiftOptions]);

  // -------------------------
  // Handlers
  // -------------------------
  const updateRow = (id: string, patch: Partial<StaffingRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const handleNumberChange =
    (id: string, field: keyof StaffingRow) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty string or valid number string
      if (raw === "" || /^-?\d*\.?\d*$/.test(raw)) {
        updateRow(id, { [field]: raw } as Partial<StaffingRow>);
      }
    };

  const handleShiftChange =
    (id: string) => (e: ChangeEvent<HTMLSelectElement>) => {
      updateRow(id, { shiftKey: e.target.value });
    };

  // -------------------------
  // Render
  // -------------------------

  if (!unitNames.length) {
    return (
      <Card className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-800">
            (6) Staffing Needs (ADMIN)
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          No units were found from Facility Setup. Once you’ve configured units,
          they will appear here automatically.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">
          (6) Staffing Needs (ADMIN)
        </h2>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1.4fr] gap-3 text-xs font-semibold text-gray-500 mb-2">
        <div />
        <div>Department Name</div>
        <div>Resource Type</div>
        <div>Minimum Staffing</div>
        <div>Minimum Staffing Threshold</div>
        <div>Ratio</div>
        <div>Max Ratio</div>
        <div>Fixed</div>
        <div>Shift Name</div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1.4fr] gap-3 items-center text-sm"
          >
            {/* Active checkbox */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600"
                checked={row.active}
                onChange={(e) =>
                  updateRow(row.id, { active: e.target.checked })
                }
              />
            </div>

            {/* Department / Unit name */}
            <div className="text-gray-800">{row.departmentName ?? row.unitName}</div>

            {/* Resource Type radio buttons */}
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-1 text-gray-700">
                <input
                  type="radio"
                  className="h-4 w-4 text-brand-600"
                  checked={row.resourceType === "NA/UC"}
                  onChange={() =>
                    updateRow(row.id, { resourceType: "NA/UC" })
                  }
                />
                <span className="text-xs">NA/UC</span>
              </label>
              <label className="inline-flex items-center gap-1 text-gray-700">
                <input
                  type="radio"
                  className="h-4 w-4 text-brand-600"
                  checked={row.resourceType === "Nurse"}
                  onChange={() =>
                    updateRow(row.id, { resourceType: "Nurse" })
                  }
                />
                <span className="text-xs">Nurse</span>
              </label>
            </div>

            {/* Minimum Staffing */}
            <div>
              <Input
                value={row.minStaffing}
                id=""
                onChange={handleNumberChange(row.id, "minStaffing")}
                className="w-full text-sm"
                placeholder="0"
              />
            </div>

            {/* Minimum Staffing Threshold */}
            <div>
              <Input
                value={row.minThreshold}
                id=""
                onChange={handleNumberChange(row.id, "minThreshold")}
                className="w-full text-sm"
                placeholder="0"
              />
            </div>

            {/* Ratio */}
            <div>
              <Input
                value={row.ratio}
                id=""
                onChange={handleNumberChange(row.id, "ratio")}
                className="w-full text-sm"
                placeholder="5"
              />
            </div>

            {/* Max Ratio */}
            <div>
              <Input
                value={row.maxRatio}
                id=""
                onChange={handleNumberChange(row.id, "maxRatio")}
                className="w-full text-sm"
                placeholder="6"
              />
            </div>

            {/* Fixed */}
            <div>
              <Input
                value={row.fixed}
                id=""
                onChange={handleNumberChange(row.id, "fixed")}
                className="w-full text-sm"
                placeholder="0"
              />
            </div>

            {/* Shift Name */}
            <div>
              <Select
                value={row.shiftKey}
                onChange={handleShiftChange(row.id)}
                className="w-full text-sm"
                ariaLabel="Shift name"
              >
                {shiftOptions.length === 0 && (
                  <option value="">No shifts defined</option>
                )}
                {shiftOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
