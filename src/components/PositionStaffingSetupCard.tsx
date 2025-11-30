import { useState, useMemo, useCallback } from "react";
import { useApp } from "@/store/AppContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import debounce from "lodash.debounce";

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

const MOCK_CENSUS = 25;

// ----------------------------------------
// STAFFING CALC
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
  const { master, data, updateData } = useApp();

  // Load shifts from ShiftConfig
  const shiftOptions = Array.isArray(data?.shiftConfig)
    ? data.shiftConfig.filter((s) => s.shift_name && s.shift_name !== "N/A")
    : [];

  const selectedCampus = master.facility;

  const filteredUnits = useMemo(() => {
    if (!selectedCampus) return MOCK_UNITS;
    return MOCK_UNITS.filter((u) => u.campus === selectedCampus);
  }, [selectedCampus]);

  // ----------------------------------------
  // INITIAL ROWS
  // ----------------------------------------
  const [rows, setRows] = useState(() =>
    Array.isArray(data?.staffingConfig) && data.staffingConfig.length > 0
      ? data.staffingConfig
      : MOCK_UNITS.map((u) => ({
          id: u.id,
          unitName: "",
          active: false,
          resourceType: "",
          min: "",
          threshold: "",
          ratio: "",
          maxRatio: "",
          fixed: "",
          shiftName: "",
        }))
  );

  // ----------------------------------------
  // SAVE (DEBOUNCED)
  // ----------------------------------------
  const debouncedSave = useCallback(
    debounce((updated) => {
      updateData("staffingConfig", updated);
    }, 600),
    []
  );

  const updateRow = (id: string, patch: any) => {
    setRows((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      debouncedSave(updated);
      return updated;
    });
  };

  // ----------------------------------------
  // ADD ROW
  // ----------------------------------------
  const addRow = () => {
    const newRow = {
      id: Date.now().toString(),
      unitName: "",
      active: false,
      resourceType: "",
      min: "",
      threshold: "",
      ratio: "",
      maxRatio: "",
      fixed: "",
      shiftName: "",
    };

    setRows((prev) => {
      const updated = [...prev, newRow];
      debouncedSave(updated);
      return updated;
    });
  };

  // ----------------------------------------
  // DELETE ROW
  // ----------------------------------------
  const deleteRow = (id: string) => {
    setRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      debouncedSave(updated);
      return updated;
    });
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  return (
    <Card className="mt-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold">Staffing Needs</h2>

        <Button className="bg-green-600 hover:bg-green-700" onClick={addRow}>
          + Add Staffing Rule
        </Button>
      </div>

      {/* HEADERS */}
      <div className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1.2fr,60px] gap-3 text-xs font-semibold text-gray-500 mb-2">
        <div />
        <div>Department Name</div>
        <div>Resource Type</div>
        <div>Minimum</div>
        <div>Min Threshold</div>
        <div>Ratio</div>
        <div>Max Ratio</div>
        <div>Fixed</div>
        <div>Shift Name</div>
        <div>Actions</div>
      </div>

      {/* ROWS */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[auto,1.5fr,1.2fr,repeat(5,minmax(0,1fr)),1.2fr,60px] gap-3 items-center text-sm"
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
              value={row.unitName}
              ariaLabel="Select Department"
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
              value={row.resourceType}
              ariaLabel="Select Resource Type"
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

            {/* Shift Name */}
            <Select
              value={row.shiftName}
              ariaLabel="Select Shift Name"
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

            {/* DELETE BUTTON */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="text-red-600 !px-2 !py-1"
                onClick={() => deleteRow(row.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
