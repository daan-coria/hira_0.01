import React from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { ResourceRow } from "@/types/ResourceRow"

type ColumnVisibility = {
  info: boolean
  cost_center_name: boolean
  employee_id: boolean
  full_name: boolean
  job_name: boolean
  unit_fte: boolean
  shift_group: boolean
  weekend_group: boolean
  availability: boolean
}

type ColumnWidth = {
  info: number
  cost_center_name: number
  employee_id: number
  full_name: number
  job_name: number
  unit_fte: number
  shift_group: number
  weekend_group: number
  availability: number
}

type Props = {
  row: ResourceRow
  rowIndex: number
  effectiveIndex: number
  colVisible: ColumnVisibility
  colWidth: ColumnWidth
  weekendGroupList: string[]
  jobNames: string[]
  positions: string[]
  formatFullName: (row: ResourceRow) => string
  filteredShifts: string[]
  startResizing: (
    e: React.MouseEvent<HTMLDivElement>,
    key: keyof ColumnWidth
  ) => void
  handleChange: (
    index: number,
    field: keyof ResourceRow,
    value: any
  ) => void
  openDrawerForRow: (
    rowIndex: number,
    mode: "view" | "edit",
    isNew?: boolean
  ) => void
  openAvailabilityForRow: (rowIndex: number, weekStart?: string) => void
}

function formatWeekLabel(dateStr?: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  })
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startResizing,
  handleChange,
  openDrawerForRow,
  openAvailabilityForRow,
}: Props) {
  // Availability entries saved from the drawer
  const availabilityEntries: any[] =
    (row as any).availability && Array.isArray((row as any).availability)
      ? ((row as any).availability as any[])
      : []

  return (
    <tr className="odd:bg-white even:bg-gray-50">
      {/* Info button */}
      {colVisible.info && (
        <td
          style={{
            width: colWidth.info,
            minWidth: colWidth.info,
            maxWidth: colWidth.info,
            display: colVisible.info ? "table-cell" : "none",
          }}
          className="border px-2 py-1 text-center align-middle"
        >
          <Button
            variant="ghost"
            className="!px-2 !py-1 text-xl font-bold text-gray-700"
            onClick={() =>
              openDrawerForRow(rowIndex >= 0 ? rowIndex : effectiveIndex, "view")
            }
          >
            ««
          </Button>
        </td>
      )}

      {/* Cost Center Name */}
      {colVisible.cost_center_name && (
        <td
          style={{
            width: colWidth.cost_center_name,
            minWidth: colWidth.cost_center_name,
            maxWidth: colWidth.cost_center_name,
            display: colVisible.cost_center_name ? "table-cell" : "none",
          }}
          className="border px-2 py-1 align-middle"
        >
          <Input
            id={`cost_center_${row.id ?? effectiveIndex}`}
            value={row.cost_center_name || ""}
            onChange={(e) =>
              handleChange(effectiveIndex, "cost_center_name", e.target.value)
            }
            placeholder="Cost Center"
            className="!m-0 !p-1"
          />
        </td>
      )}

      {/* Employee ID */}
      {colVisible.employee_id && (
        <td
          style={{
            width: colWidth.employee_id,
            minWidth: colWidth.employee_id,
            maxWidth: colWidth.employee_id,
            display: colVisible.employee_id ? "table-cell" : "none",
          }}
          className="border px-2 py-1 align-middle"
        >
          <Input
            id={`employee_${row.id ?? effectiveIndex}`}
            value={row.employee_id || ""}
            onChange={(e) =>
              handleChange(effectiveIndex, "employee_id", e.target.value)
            }
            placeholder="Employee ID"
            className="!m-0 !p-1"
          />
        </td>
      )}

      {/* Full Name (First + Last) */}
      {colVisible.full_name && (
        <td
          style={{
            width: colWidth.full_name,
            minWidth: colWidth.full_name,
            maxWidth: colWidth.full_name,
            display: colVisible.full_name ? "table-cell" : "none",
          }}
          className="border px-2 py-1 align-middle"
        >
          <div className="flex gap-1">
            <Input
              id={`first_name_${row.id ?? effectiveIndex}`}
              value={row.first_name || ""}
              onChange={(e) =>
                handleChange(effectiveIndex, "first_name", e.target.value)
              }
              placeholder="First"
              className="!m-0 !p-1"
            />
            <Input
              id={`last_name_${row.id ?? effectiveIndex}`}
              value={row.last_name || ""}
              onChange={(e) =>
                handleChange(effectiveIndex, "last_name", e.target.value)
              }
              placeholder="Last"
              className="!m-0 !p-1"
            />
          </div>
        </td>
      )}

      {/* Job Name */}
      {colVisible.job_name && (
        <td
          style={{
            width: colWidth.job_name,
            minWidth: colWidth.job_name,
            maxWidth: colWidth.job_name,
            display: colVisible.job_name ? "table-cell" : "none",
          }}
          className="border px-2 py-1 align-middle"
        >
          <Select
            value={row.job_name || row.position || ""}
            onChange={(e) =>
              handleChange(effectiveIndex, "job_name", e.target.value)
            }
            className="!m-0 !p-1"
          >
            <option value="">-- Select --</option>
            {jobNames.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </Select>
        </td>
      )}

      {/* Unit FTE */}
      {colVisible.unit_fte && (
        <td
          style={{
            width: colWidth.unit_fte,
            minWidth: colWidth.unit_fte,
            maxWidth: colWidth.unit_fte,
            display: colVisible.unit_fte ? "table-cell" : "none",
          }}
          className="border px-2 py-1 text-right align-middle"
        >
          <Input
            id={`unit_fte_${row.id ?? effectiveIndex}`}
            type="number"
            min={0}
            step={0.1}
            value={row.unit_fte ?? ""}
            onChange={(e) =>
              handleChange(
                effectiveIndex,
                "unit_fte",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className="!m-0 !p-1 text-right"
          />
        </td>
      )}

      {/* Shift Group */}
      {colVisible.shift_group && (
        <td
          style={{
            width: colWidth.shift_group,
            minWidth: colWidth.shift_group,
            maxWidth: colWidth.shift_group,
            display: colVisible.shift_group ? "table-cell" : "none",
          }}
          className="border px-2 py-1 align-middle"
        >
          <Select
            value={row.shift_group || row.shift || ""}
            onChange={(e) =>
              handleChange(effectiveIndex, "shift_group", e.target.value)
            }
            className="!m-0 !p-1"
          >
            <option value="">-- Select --</option>
            {filteredShifts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </td>
      )}

      {/* Weekend Group */}
      {colVisible.weekend_group && (
        <td
          style={{
            width: colWidth.weekend_group,
            minWidth: colWidth.weekend_group,
            maxWidth: colWidth.weekend_group,
            display: colVisible.weekend_group ? "table-cell" : "none",
          }}
          className="border px-2 py-1 align-middle"
        >
          <Select
            value={row.weekend_group || ""}
            onChange={(e) =>
              handleChange(effectiveIndex, "weekend_group", e.target.value)
            }
            className="!m-0 !p-1"
          >
            <option value="">-- Select --</option>
            {weekendGroupList.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </td>
      )}

      {/* Availability (uses saved availabilityEntries) */}
      {colVisible.availability && (
        <td
          style={{
            width: colWidth.availability,
            minWidth: colWidth.availability,
            maxWidth: colWidth.availability,
            display: colVisible.availability ? "table-cell" : "none",
          }}
          className="border px-2 py-1 align-middle"
        >
          <div
            className="availability-row"
            style={{
              overflowX: "hidden",
              overflowY: "hidden",
              whiteSpace: "nowrap",
              width: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 5200, // 52 "slots" at 100px each – matches header strip
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
              }}
            >
              {availabilityEntries.length === 0 ? (
                <div className="text-xs text-gray-400 px-2 py-1">
                  No availability defined
                </div>
              ) : (
                availabilityEntries.map((entry, idx) => {
                  const weekStart: string | undefined =
                    entry.weekStart || entry.start || entry.date
                  const fte: number | string =
                    typeof entry.fte === "number"
                      ? entry.fte
                      : entry.fte ?? row.unit_fte ?? ""

                  return (
                    <div
                      key={idx}
                      style={{
                        width: 100,
                        padding: "4px",
                        marginRight: 4,
                        borderRadius: 9999,
                        border: "1px solid #e5e7eb",
                        background: "#f9fafb",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        openAvailabilityForRow(
                          effectiveIndex,
                          weekStart || undefined
                        )
                      }
                    >
                      <div className="text-[10px] text-gray-600">
                        {formatWeekLabel(weekStart)}
                      </div>
                      <div className="text-xs font-semibold">{fte}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </td>
      )}
    </tr>
  )
}