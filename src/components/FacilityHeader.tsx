import { useEffect, useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useApp } from "@/store/AppContext"
import * as XLSX from "xlsx"

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
  DroppableProvided,
} from "@hello-pangea/dnd"


// --------------------------------
// Types
// --------------------------------
type Props = {
  onNext?: () => void
  onSetupComplete?: () => void
}

type ExcelRow = {
  Facility: string
  Unit: string
  "Functional Area": string
  "Cost Center"?: string | number
  Capacity?: number | string
  [extra: string]: any
}

type UnitOfService = "Patient Days" | "Visits" | "Cases" | "N/A" | ""

export type CostCenterRow = {
  id: string
  facility: string
  campus: string
  functionalArea: string
  unit: string
  costCenter: string
  capacity: number | "N/A"
  costCenterName: string
  unitGrouping: string
  floatPool: boolean
  poolParticipation: string[]
  unitOfService: UnitOfService
  sortOrder: number
}

// --------------------------------
// Helpers
// --------------------------------
const makeId = () => Math.random().toString(36).slice(2, 10)

const capacityPlaceholder = (unit: string) => {
  if (!unit) return 20
  let h = 0
  for (let i = 0; i < unit.length; i++) h = (h * 31 + unit.charCodeAt(i)) % 997
  return 15 + (h % 31)
}

// --------------------------------
// Main Component
// --------------------------------
export default function FacilityHeader({ onNext, onSetupComplete }: Props) {
  const { updateFacilitySetup } = useApp()

  const [rows, setRows] = useState<CostCenterRow[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  // --------------------------------
  // Dropdown option builders
  // --------------------------------
  const campusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.campus).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [rows]
  )

  const functionalAreaOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.functionalArea).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [rows]
  )

  const unitGroupingOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.unitGrouping).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [rows]
  )

  const floatPoolOptions = useMemo(
    () =>
      rows
        .filter((r) => r.floatPool)
        .map((r) => ({
          key: r.costCenter,
          label: `${r.costCenter} – ${r.costCenterName || r.unit}`,
        })),
    [rows]
  )

  // --------------------------------
  // Excel Upload Handler
  // --------------------------------
  const handleUploadExcel = () => {
    if (!selectedFile) return
    setUploading(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        const raw = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" })
        if (!raw.length) throw new Error("Sheet is empty or unreadable")

        let counter = 1
        const mapped: CostCenterRow[] = raw
          .map((r) => {
            const Facility = r.Facility?.toString().trim()
            const Unit = r.Unit?.toString().trim()
            const FunctionalArea = r["Functional Area"]?.toString().trim()

            if (!Facility || !Unit) return null

            let cc =
              r["Cost Center"] ??
              (r as any).CostCenter ??
              (r as any)["cost center"] ??
              ""
            cc = String(cc).trim() || `${Facility}-${Unit}`

            let cap = r.Capacity
            if (!cap || cap === "") cap = capacityPlaceholder(Unit)

            const Capacity =
              typeof cap === "string"
                ? Number(cap) || capacityPlaceholder(Unit)
                : cap

            return {
              id: makeId(),
              facility: Facility,
              campus: Facility,
              functionalArea: FunctionalArea,
              unit: Unit,
              costCenter: cc,
              capacity: Capacity,
              costCenterName: Unit, // NOTE from your request: default = Unit
              unitGrouping: "",
              floatPool: false,
              poolParticipation: [],
              unitOfService: "Patient Days",
              sortOrder: counter++,
            } as CostCenterRow
          })
          .filter(Boolean) as CostCenterRow[]

        setRows(mapped)
        setWarning(`✅ Loaded ${mapped.length} rows from "${sheetName}".`)
      } catch (err: any) {
        console.error("Excel parse error:", err)
        setWarning(`❌ ${err?.message || "Failed to read Excel."}`)
        setRows([])
      } finally {
        setUploading(false)
      }
    }

    reader.readAsArrayBuffer(selectedFile)
  }

  // --------------------------------
  // Drag & Drop Reordering
  // --------------------------------
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newRows = Array.from(rows)
    const [moved] = newRows.splice(result.source.index, 1)
    newRows.splice(result.destination.index, 0, moved)

    const updated = newRows.map((r, i) => ({
      ...r,
      sortOrder: i + 1,
    }))

    setRows(updated)
  }

  // --------------------------------
  // Row Updater
  // --------------------------------
  const updateRow = <K extends keyof CostCenterRow>(
    id: string,
    key: K,
    value: CostCenterRow[K]
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r

        let next = { ...r, [key]: value }

        if (key === "floatPool") {
          if (value === true) {
            next.capacity = "N/A"
            next.unitOfService = "N/A"
            next.poolParticipation = []
          } else {
            if (next.capacity === "N/A") {
              next.capacity = capacityPlaceholder(next.unit)
            }
            if (next.unitOfService === "N/A") {
              next.unitOfService = "Patient Days"
            }
          }
        }

        if (next.floatPool) {
          next.capacity = "N/A"
          next.unitOfService = "N/A"
          next.poolParticipation = []
        }

        return next
      })
    )
  }

  const addRow = () => {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0)

    const newRow: CostCenterRow = {
      id: makeId(),
      facility: "",
      campus: "",
      functionalArea: "",
      unit: "",
      costCenter: "",
      capacity: capacityPlaceholder(""),
      costCenterName: "",
      unitGrouping: "",
      floatPool: false,
      poolParticipation: [],
      unitOfService: "Patient Days",
      sortOrder: maxSort + 1,
    }

    setRows((p) => [...p, newRow])
  }

  const deleteRow = (id: string) => {
    const updated = rows.filter((r) => r.id !== id)
    const resequenced = updated.map((r, i) => ({
      ...r,
      sortOrder: i + 1,
    }))
    setRows(resequenced)
  }

  // --------------------------------
  // Push to AppContext
  // --------------------------------
  useEffect(() => {
    updateFacilitySetup(rows)
  }, [rows])

  // --------------------------------
  // Continue
  // --------------------------------
  const handleContinue = () => {
    onNext?.()
    onSetupComplete?.()
  }

  // --------------------------------
  // Render
  // --------------------------------
  return (
    <Card title="Facility Setup">
      {/* Upload Controls */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="file"
          accept=".xlsx"
          title="Upload Excel file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />

        <Button
          variant="primary"
          onClick={handleUploadExcel}
          disabled={!selectedFile || uploading}
        >
          {uploading ? "Parsing..." : "Upload Excel"}
        </Button>

        <Button variant="ghost" onClick={addRow}>
          Add Cost Center
        </Button>

        <Button variant="ghost" onClick={() => setRows([])}>
          Clear All
        </Button>

        {warning && <span className="text-sm text-gray-600">{warning}</span>}
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="rowsTable">
            {(provided: DroppableProvided) => (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 border">Drag</th>
                    <th className="px-2 py-2 border">Cost Center Key</th>
                    <th className="px-2 py-2 border">Cost Center Name</th>
                    <th className="px-2 py-2 border">Campus</th>
                    <th className="px-2 py-2 border">Functional Area</th>
                    <th className="px-2 py-2 border">Unit Grouping</th>
                    <th className="px-2 py-2 border">Department</th>
                    <th className="px-2 py-2 border">Capacity</th>
                    <th className="px-2 py-2 border">Float Pool</th>
                    <th className="px-2 py-2 border">Pool Participation</th>
                    <th className="px-2 py-2 border">Unit of Service</th>
                    <th className="px-2 py-2 border">Actions</th>
                  </tr>
                </thead>

                <tbody
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {rows.map((row, idx) => (
                    <Draggable
                      key={row.id}
                      draggableId={row.id}
                      index={idx}
                    >
                      {(provided: DraggableProvided) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          {/* Drag Handle Only */}
                          <td className="px-2 py-2 border">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-lg"
                              title="Drag to reorder"
                            >
                              ⠿
                            </div>
                          </td>

                          {/* Key */}
                          <td className="px-2 py-2 border">
                            <Input
                              id={`cc-key-${row.id}`}
                              value={row.costCenter}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "costCenter",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          {/* Name */}
                          <td className="px-2 py-2 border">
                            <Input
                              id={`cc-name-${row.id}`}
                              value={row.costCenterName}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "costCenterName",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          {/* Campus */}
                          <td className="px-2 py-2 border">
                            <Select
                              id={`campus-${row.id}`}
                              value={row.campus}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "campus",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">-- Select --</option>
                              {campusOptions.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </Select>
                          </td>

                          {/* Functional Area */}
                          <td className="px-2 py-2 border">
                            <Select
                              id={`fa-${row.id}`}
                              value={row.functionalArea}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "functionalArea",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">-- Select --</option>
                              {functionalAreaOptions.map((fa) => (
                                <option key={fa} value={fa}>
                                  {fa}
                                </option>
                              ))}
                            </Select>

                            <Input
                              id={`fa-new-${row.id}`}
                              className="mt-1"
                              placeholder="Or type new"
                              value={row.functionalArea}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "functionalArea",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          {/* Unit Grouping */}
                          <td className="px-2 py-2 border">
                            <Select
                              id={`ug-${row.id}`}
                              value={row.unitGrouping}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "unitGrouping",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">-- Select --</option>
                              {unitGroupingOptions.map((ug) => (
                                <option key={ug} value={ug}>
                                  {ug}
                                </option>
                              ))}
                            </Select>

                            <Input
                              id={`ug-new-${row.id}`}
                              className="mt-1"
                              placeholder="Or type new"
                              value={row.unitGrouping}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "unitGrouping",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          {/* Department */}
                          <td className="px-2 py-2 border">
                            <Input
                              id={`unit-${row.id}`}
                              value={row.unit}
                              onChange={(e) =>
                                updateRow(row.id, "unit", e.target.value)
                              }
                            />
                          </td>

                          {/* Capacity */}
                          <td className="px-2 py-2 border">
                            {row.floatPool ? (
                              <input
                                title="Not applicable"
                                disabled
                                value="N/A"
                                className="w-full border border-gray-300 rounded-md px-2 py-1 bg-gray-100 text-gray-400 text-sm"
                              />
                            ) : (
                              <Input
                                id={`cap-${row.id}`}
                                type="number"
                                value={
                                  row.capacity === "N/A" ? "" : row.capacity
                                }
                                onChange={(e) =>
                                  updateRow(
                                    row.id,
                                    "capacity",
                                    Number(e.target.value) || 0
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* Float Pool */}
                          <td className="px-2 py-2 border text-center">
                            <input
                              type="checkbox"
                              title="Toggle Float Pool"
                              aria-label="Toggle float pool"
                              checked={row.floatPool}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "floatPool",
                                  e.target.checked
                                )
                              }
                            />
                          </td>

                          {/* Pool Participation */}
                          <td className="px-2 py-2 border">
                            {row.floatPool ? (
                              <input
                                title="Not applicable"
                                disabled
                                value="N/A"
                                className="w-full border border-gray-300 rounded-md px-2 py-1 bg-gray-100 text-gray-400 text-sm"
                              />
                            ) : (
                              <select
                                id={`pool-${row.id}`}
                                aria-label="Pool Participation"
                                title="Select float pools"
                                multiple
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                                value={row.poolParticipation}
                                onChange={(e) => {
                                  const values = Array.from(
                                    e.target.selectedOptions
                                  ).map((o) => o.value)
                                  updateRow(
                                    row.id,
                                    "poolParticipation",
                                    values
                                  )
                                }}
                              >
                                {floatPoolOptions.length === 0 && (
                                  <option disabled>No float pools</option>
                                )}

                                {floatPoolOptions
                                  .filter(
                                    (opt) => opt.key !== row.costCenter
                                  )
                                  .map((opt) => (
                                    <option
                                      key={opt.key}
                                      value={opt.key}
                                    >
                                      {opt.label}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </td>

                          {/* Unit of Service */}
                          <td className="px-2 py-2 border">
                            {row.floatPool ? (
                              <input
                                title="Not applicable"
                                disabled
                                value="N/A"
                                className="w-full border border-gray-300 rounded-md px-2 py-1 bg-gray-100 text-gray-400 text-sm"
                              />
                            ) : (
                              <Select
                                id={`uos-${row.id}`}
                                value={row.unitOfService}
                                onChange={(e) =>
                                  updateRow(
                                    row.id,
                                    "unitOfService",
                                    e.target.value as UnitOfService
                                  )
                                }
                              >
                                <option value="">
                                  -- Unit of Service --
                                </option>
                                <option value="Patient Days">
                                  Patient Days
                                </option>
                                <option value="Visits">Visits</option>
                                <option value="Cases">Cases</option>
                                <option value="N/A">N/A</option>
                              </Select>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-2 py-2 border">
                            <Button variant="ghost" onClick={() => deleteRow(row.id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Continue */}
      <div className="flex justify-end mt-6">
        <Button variant="primary" onClick={handleContinue} disabled={!rows.length}>
          Continue →
        </Button>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Note: Cost Center Name defaults to the Unit name. You can edit it at any time.
      </p>
    </Card>
  )
}
