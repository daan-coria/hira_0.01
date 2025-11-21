import { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

// -------------------------------------------------------
// MOCK DATA
// -------------------------------------------------------
const MOCK_UNITS = [
  { id: "5E-ICU", name: "5E ICU" },
  { id: "5W", name: "5W" },
  { id: "6E", name: "6E" },
];

const MOCK_RESOURCE_TYPES = ["Nurse", "NA/UC"];

const MOCK_SHIFTS = [
  { value: "shift1", label: "Weekday 7A-7P" },
  { value: "shift2", label: "Weekday 7P-7A" },
  { value: "shift3", label: "Weekday 7A-7P No Lunch" },
  { value: "shift4", label: "Weekday 7P-7A No Lunch" }
];

// -------------------------------------------------------
// COMPONENT
// -------------------------------------------------------
export default function PositionStaffingSetupCard() {
  const [rows, setRows] = useState(() =>
    MOCK_UNITS.map((u) => ({
      id: u.id,
      unitName: u.name,
      active: false,
      resourceType: "Nurse",
      min: "",
      threshold: "",
      ratio: "",
      maxRatio: "",
      fixed: "",
      shift: MOCK_SHIFTS[0].value,
    }))
  );

  const updateRow = (id: string, patch: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  return (
    <Card className="mt-4">
      {/* Header */}
      <h2 className="text-sm font-semibold mb-4">
        Staffing Needs
      </h2>

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

      {/* Rows */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1.4fr] gap-3 items-center text-sm"
          >
            {/* Checkbox */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={row.active}
                onChange={(e) =>
                  updateRow(row.id, { active: e.target.checked })
                }
              />
            </div>

            {/* Name */}
            <div>{row.unitName}</div>

            {/* Resource type radio */}
            <div className="flex items-center gap-4">
              {MOCK_RESOURCE_TYPES.map((rt) => (
                <label
                  key={rt}
                  className="inline-flex items-center gap-1 text-gray-700"
                >
                  <input
                    type="radio"
                    className="h-4 w-4"
                    checked={row.resourceType === rt}
                    onChange={() =>
                      updateRow(row.id, { resourceType: rt })
                    }
                  />
                  <span className="text-xs">{rt}</span>
                </label>
              ))}
            </div>

            {/* Minimum Staffing */}
            <Input
              value={row.min}
              id=""
              onChange={(e) =>
                updateRow(row.id, { min: e.target.value })
              }
              className="text-sm"
            />

            {/* Threshold */}
            <Input
              value={row.threshold}
              id=""
              onChange={(e) =>
                updateRow(row.id, { threshold: e.target.value })
              }
              className="text-sm"
            />

            {/* Ratio */}
            <Input
              value={row.ratio}
              id=""
              onChange={(e) =>
                updateRow(row.id, { ratio: e.target.value })
              }
              className="text-sm"
            />

            {/* Max Ratio */}
            <Input
              value={row.maxRatio}
              id=""
              onChange={(e) =>
                updateRow(row.id, { maxRatio: e.target.value })
              }
              className="text-sm"
            />

            {/* Fixed */}
            <Input
              value={row.fixed}
              id=""
              onChange={(e) =>
                updateRow(row.id, { fixed: e.target.value })
              }
              className="text-sm"
            />

            {/* Shift */}
            <Select
              value={row.shift}
              onChange={(e) =>
                updateRow(row.id, { shift: e.target.value })
              }
              className="text-sm"
            >
              {MOCK_SHIFTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>
    </Card>
  );
}
