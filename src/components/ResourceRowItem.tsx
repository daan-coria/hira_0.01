import { ResourceRow } from "@/types/ResourceRow"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import WeeklyFTEBar from "@/components/WeeklyFTEBar"

const WEEK_WIDTH = 100
const TOTAL_WEEKS_WIDTH = WEEK_WIDTH * 52

type Props = {
  row: ResourceRow
  rowIndex: number
  effectiveIndex: number
  colVisible: any
  colWidth: any
  weekendGroupList: string[]
  jobNames: string[]
  positions: string[]
  formatFullName: (row: ResourceRow) => string
  filteredShifts: string[]
  startResizing: Function
  handleChange: Function
  openDrawerForRow: Function
  openAvailabilityForRow: Function
}

export default function ResourceRowItem({
  row,
  rowIndex,
  effectiveIndex,
  colVisible,
  colWidth,
  weekendGroupList,
  jobNames,
  positions,
  formatFullName,
  filteredShifts,
  startResizing,
  handleChange,
  openDrawerForRow,
  openAvailabilityForRow,
}: Props) {
  return (
    <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">

      {/* INFO */}
      {colVisible.info && (
        <td
          style={{
            width: colWidth.info,
            minWidth: colWidth.info,
            maxWidth: colWidth.info,
          }}
          className="relative border px-2 py-1 text-center"
        >
          <Button
            variant="ghost"
            className="!px-2 !py-1 text-xl font-bold text-gray-700"
            onClick={() => openDrawerForRow(rowIndex, "view", false)}
          >
            ««
          </Button>

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "info")}
          />
        </td>
      )}

      {/* COST CENTER */}
      {colVisible.cost_center_name && (
        <td
          style={{
            width: colWidth.cost_center_name,
            minWidth: colWidth.cost_center_name,
            maxWidth: colWidth.cost_center_name,
          }}
          className="relative border px-2 py-1"
        >
          <Input
            value={row.cost_center_name || ""}
            id=""
            onChange={(e) =>
              handleChange(effectiveIndex, "cost_center_name", e.target.value)
            }
            className="!m-0 !p-1 w-full"
          />

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "cost_center_name")}
          />
        </td>
      )}

      {/* EMPLOYEE ID */}
      {colVisible.employee_id && (
        <td
          style={{
            width: colWidth.employee_id,
            minWidth: colWidth.employee_id,
            maxWidth: colWidth.employee_id,
          }}
          className="relative border px-2 py-1"
        >
          <Input
            value={row.employee_id || ""}
            id=""
            onChange={(e) =>
              handleChange(effectiveIndex, "employee_id", e.target.value)
            }
            className="!m-0 !p-1 w-full"
          />
          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "employee_id")}
          />
        </td>
      )}

      {/* FULL NAME */}
      {colVisible.full_name && (
        <td
          style={{
            width: colWidth.full_name,
            minWidth: colWidth.full_name,
            maxWidth: colWidth.full_name,
          }}
          className="relative border px-2 py-1"
        >
          <div className="px-2 py-1 bg-white rounded border border-gray-200 text-gray-800 text-sm">
            {formatFullName(row)}
          </div>

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "full_name")}
          />
        </td>
      )}

      {/* JOB NAME */}
      {colVisible.job_name && (
        <td
          style={{
            width: colWidth.job_name,
            minWidth: colWidth.job_name,
            maxWidth: colWidth.job_name,
          }}
          className="relative border px-2 py-1"
        >
          <Select
            value={row.job_name || row.position}
            onChange={(e) =>
              handleChange(effectiveIndex, "job_name", e.target.value)
            }
            className="!m-0 !p-1"
          >
            <option value="">-- Select --</option>
            {jobNames.concat(
              positions.filter(
                (p) => !jobNames.includes(p) && p !== (row.job_name || "")
              )
            ).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "job_name")}
          />
        </td>
      )}

      {/* UNIT FTE */}
      {colVisible.unit_fte && (
        <td
          style={{
            width: colWidth.unit_fte,
            minWidth: colWidth.unit_fte,
            maxWidth: colWidth.unit_fte,
          }}
          className="relative border px-2 py-1 text-right"
        >
          <Input
            type="number"
            id=""
            min={0}
            step={0.1}
            value={row.unit_fte}
            onChange={(e) =>
              handleChange(effectiveIndex, "unit_fte", Number(e.target.value))
            }
            className="!m-0 !p-1 w-full text-right"
          />

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "unit_fte")}
          />
        </td>
      )}

      {/* SHIFT GROUP */}
      {colVisible.shift_group && (
        <td
          style={{
            width: colWidth.shift_group,
            minWidth: colWidth.shift_group,
            maxWidth: colWidth.shift_group,
          }}
          className="relative border px-2 py-1"
        >
          <Select
            value={row.shift_group}
            onChange={(e) =>
              handleChange(effectiveIndex, "shift_group", e.target.value)
            }
            className="!m-0 !p-1"
          >
            <option value="">-- Select --</option>
            {filteredShifts.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </Select>

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "shift_group")}
          />
        </td>
      )}

      {/* WEEKEND GROUP */}
      {colVisible.weekend_group && (
        <td
          style={{
            width: colWidth.weekend_group,
            minWidth: colWidth.weekend_group,
            maxWidth: colWidth.weekend_group,
          }}
          className="relative border px-2 py-1"
        >
          <Select
            value={row.weekend_group}
            onChange={(e) =>
              handleChange(effectiveIndex, "weekend_group", e.target.value)
            }
            className="!m-0 !p-1"
          >
            <option value="">-- Select --</option>
            {weekendGroupList.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "weekend_group")}
          />
        </td>
      )}

      {/* AVAILABILITY CELL (CLIPPED VIEWPORT) */}
      {colVisible.availability && (
        <td
          style={{
            width: colWidth.availability,
            minWidth: colWidth.availability,
            maxWidth: colWidth.availability,
          }}
          className="relative border px-2 py-1 whitespace-nowrap"
        >
          <div
            className="availability-row overflow-hidden"
            style={{
              width: "100%",
            }}
          >
            <div
              className="availability-strip"
              style={{ width: TOTAL_WEEKS_WIDTH }}
            >
              <WeeklyFTEBar
                baseFTE={row.unit_fte}
                availability={row.availability || []}
                onWeekClick={(weekStart) =>
                  openAvailabilityForRow(effectiveIndex, weekStart)
                }
              />
            </div>
          </div>

          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
            onMouseDown={(e) => startResizing(e, "availability")}
          />
        </td>
      )}
    </tr>
  )
}
