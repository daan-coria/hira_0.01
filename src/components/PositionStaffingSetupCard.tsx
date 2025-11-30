import { useState, useMemo } from "react";
import { useApp } from "@/store/AppContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

// ----------------------------------------
// MOCK DATA — department + resource types
// ----------------------------------------
const MOCK_UNITS = [
  { id: "5E-ICU", name: "5E ICU", campus: "Bay" },
  { id: "5W", name: "5W", campus: "Bay" },
  { id: "6E", name: "6E", campus: "Lansing" },
  { id: "4N", name: "4N Med Surg", campus: "Lansing" },
];

const MOCK_RESOURCE_TYPES = ["Nurse", "NA/UC", "LPN", "Clerk"];

// Constant census for calculation (unchanged)
const MOCK_CENSUS = 25;

// ----------------------------------------
// CALCULATION LOGIC
// ----------------------------------------
function computeStaffing(row: any, census: number) {
  const min = Number(row.min) || 0;
  const ratio5 = Number(row.ratio) || 0;
  const ratio6 = Number(row.maxRatio) || 0;
  const fixed = Number(row.fixed) || 0;

  if (!ratio5 || !ratio6) return "";

  const staffAt5 = Math.ceil(census / ratio5);
  const staffAt6 = Math.ceil(census / ratio6);

  let required = Math.max(staffAt5, staffAt6);
  required += fixed;
  required = Math.max(required, min);

  return required;
}

// ----------------------------------------
// COMPONENT
// ----------------------------------------
export default function PositionStaffingSetupCard() {
  const { master, data } = useApp();

  // Load real shifts from ShiftConfig
  const shiftOptions = Array.isArray(data?.shiftConfig)
    ? data.shiftConfig.filter((s) => s.shift_name && s.shift_name !== "N/A")
    : [];

  const selectedCampus = master.facility;

  const filteredUnits = useMemo(() => {
    if (!selectedCampus) return MOCK_UNITS;
    return MOCK_UNITS.filter((u) => u.campus === selectedCampus);
  }, [selectedCampus]);

  // Initial staffing rows
  const [rows, setRows] = useState(() =>
    MOCK_UNITS.map((u) => ({
      id: u.id,
      unitName: "",
      active: false,
      resourceType: "",
      min: "",
      threshold: "",
      ratio: "",
      maxRatio: "",
      fixed: "",
      shiftName: "", // NEW FIELD
    }))
  );

  const updateRow = (id: string, patch: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <Card className="mt-4">
      <h2 className="text-sm font-semibold mb-4">Staffing Needs</h2>

      {/* Column headers */}
      <div className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1.2fr] gap-3 text-xs font-semibold text-gray-500 mb-2">
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
        {rows.map((row) => {
          return (
            <div
              key={row.id}
              className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1.2fr] gap-3 items-center text-sm"
            >
              {/* Checkbox */}
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={row.active}
                  onChange={(e) =>
                    updateRow(row.id, { active: e.target.checked })
                  }
                />
              </div>

              {/* Department */}
              <Select
                ariaLabel="Select Department"
                value={row.unitName}
                onChange={(e) =>
                  updateRow(row.id, { unitName: e.target.value })
                }
              >
                <option value="">Select Department</option>
                {filteredUnits.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </Select>

              {/* Resource Type */}
              <Select
                ariaLabel="Select Resource Type"
                value={row.resourceType}
                onChange={(e) =>
                  updateRow(row.id, { resourceType: e.target.value })
                }
              >
                <option value="">Resource Type</option>
                {MOCK_RESOURCE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </Select>

              {/* Min */}
              <Input
                value={row.min}
                id=""
                onChange={(e) => updateRow(row.id, { min: e.target.value })}
              />

              {/* Threshold */}
              <Input
                value={row.threshold}
                id=""
                onChange={(e) =>
                  updateRow(row.id, { threshold: e.target.value })
                }
              />

              {/* Ratio */}
              <Input
                value={row.ratio}
                id=""
                onChange={(e) => updateRow(row.id, { ratio: e.target.value })}
              />

              {/* Max Ratio */}
              <Input
                value={row.maxRatio}
                id=""
                onChange={(e) =>
                  updateRow(row.id, { maxRatio: e.target.value })
                }
              />

              {/* Fixed */}
              <Input
                value={row.fixed}
                id=""
                onChange={(e) => updateRow(row.id, { fixed: e.target.value })}
              />

              {/* Shift Name dropdown */}
              <Select
                ariaLabel="Select Shift Name"
                value={row.shiftName}
                onChange={(e) =>
                  updateRow(row.id, { shiftName: e.target.value })
                }
              >
                <option value="">Select Shift</option>
                {shiftOptions.map((s) => (
                  <option key={s.id} value={s.shift_name}>
                    {s.shift_name}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
