import { useState, useMemo } from "react";
import { useApp } from "@/store/AppContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

// ----------------------------------------
// MOCK DATA 
// ----------------------------------------
const MOCK_UNITS = [
  { id: "5E-ICU", name: "5E ICU", campus: "Bay" },
  { id: "5W", name: "5W", campus: "Bay" },
  { id: "6E", name: "6E", campus: "Lansing" },
  { id: "4N", name: "4N Med Surg", campus: "Lansing" },
];

const MOCK_RESOURCE_TYPES = ["Nurse", "NA/UC", "LPN", "Clerk"];

const MOCK_SHIFTS = [
  { value: "shift1", label: "Weekday 7A-7P" },
  { value: "shift2", label: "Weekday 7P-7A" },
  { value: "shift3", label: "Weekday 7A-7P No Lunch" },
  { value: "shift4", label: "Weekday 7P-7A No Lunch" }
];

// We use a constant census
const MOCK_CENSUS = 25;




// ----------------------------------------
// CALCULATION LOGIC
// ----------------------------------------
function computeStaffing(row: any, census: number) {
  const min = Number(row.min) || 0;
  const ratio5 = Number(row.ratio) || 0;        // Target ratio (ex: 5)
  const ratio6 = Number(row.maxRatio) || 0;     // Max ratio (ex: 6)
  const fixed = Number(row.fixed) || 0;

  if (!ratio5 || !ratio6) return "";

  // STAFF BASED ON TARGET RATIO (1:5)
  const staffAt5 = Math.ceil(census / ratio5);

  // STAFF BASED ON MAX ALLOWABLE RATIO (1:6)
  const staffAt6 = Math.ceil(census / ratio6);

  // The policy says:
  //   "The target ratio is 1:5 BUT staffing must NEVER exceed 1:6"
  //
  // Therefore we choose the HIGHER of the two:
  //
  //  - staffAt5 ensures good staffing
  //  - staffAt6 ensures you do NOT violate the max ratio cap
  let required = Math.max(staffAt5, staffAt6);

  // Add fixed nurses (free charge)
  required += fixed;

  // Apply minimum staffing rule
  required = Math.max(required, min);

  return required;
}



// ----------------------------------------
// COMPONENT
// ----------------------------------------
export default function PositionStaffingSetupCard() {
  const { master } = useApp();
  const selectedCampus = master.facility;

  // Filter department options based on campus filter
  const filteredUnits = useMemo(() => {
    if (!selectedCampus) return MOCK_UNITS;
    return MOCK_UNITS.filter((u) => u.campus === selectedCampus);
  }, [selectedCampus]);


  // Initialize rows with empty departmentName + resourceType
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
      shift: MOCK_SHIFTS[0].value,
    }))
  );

  const updateRow = (id: string, patch: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };


  return (
    <Card className="mt-4">
      <h2 className="text-sm font-semibold mb-4">Staffing Needs</h2>

      {/* Column headers */}
      <div className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1fr] gap-3 text-xs font-semibold text-gray-500 mb-2">
        <div />
        <div>Department Name</div>
        <div>Resource Type</div>
        <div>Minimum Staffing</div>
        <div>Minimum Staffing Threshold</div>
        <div>Ratio</div>
        <div>Max Ratio</div>
        <div>Fixed</div>
        <div>Calculated Staff</div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {rows.map((row) => {
          const calculated = computeStaffing(row, MOCK_CENSUS);

          return (
            <div
              key={row.id}
              className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1fr] gap-3 items-center text-sm"
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

              {/* Department Name (Filtered dropdown) */}
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

              {/* Resource Type (Single dropdown) */}
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

              {/* Minimum */}
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

              {/* Calculated */}
              <div className="text-center font-semibold text-brand-600">
                {calculated || "-"}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}