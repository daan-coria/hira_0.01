import { useEffect, useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useApp } from "@/store/AppContext"
import * as XLSX from "xlsx"
import { Filter } from "lucide-react"
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

type Filters = {
  costCenterKey: string
  costCenterName: string
  campus: string
  functionalArea: string
  unitGrouping: string
  department: string
  floatPool: "" | "true" | "false"
  unitOfService: string
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

  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    costCenterKey: "",
    costCenterName: "",
    campus: "",
    functionalArea: "",
    unitGrouping: "",
    department: "",
    floatPool: "",
    unitOfService: "",
  })
  const [openFilter, setOpenFilter] = useState<keyof Filters | null>(null)

  // Functional Area modal
  const [showNewFA, setShowNewFA] = useState(false)
  const [newFAName, setNewFAName] = useState("")
  const [targetRowId, setTargetRowId] = useState<string | null>(null)

  // Dropdown option builders
  const campusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.campus).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
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

  const unitOfServiceOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.unitOfService).filter(Boolean))).sort(
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
          campus: r.campus,
        })),
    [rows]
  )

  // Excel Upload Handler

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

            const row: CostCenterRow = {
              id: makeId(),
              facility: Facility,
              campus: Facility,
              functionalArea: FunctionalArea,
              unit: Unit,
              costCenter: cc,
              capacity: Capacity,
              costCenterName: Unit, // default = Unit
              unitGrouping: "",
              floatPool: false,
              poolParticipation: [],
              unitOfService: "Patient Days",
              sortOrder: counter++,
            }

            return row
          })
          .filter(Boolean) as CostCenterRow[]

        setRows(mapped)
        setWarning(`✅ Loaded ${mapped.length} rows from "${sheetName}".`)
      } catch (err: any) {
        console.error("Excel parse error:", err)
        setRows([])
        setWarning(`❌ ${err?.message || "Failed to read Excel."}`)
      } finally {
        setUploading(false)
      }
    }

    reader.readAsArrayBuffer(selectedFile)
  }

  // Row Updater
  
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
    const row: CostCenterRow = {
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
    setRows((prev) => [...prev, row])
  }

  const deleteRow = (id: string) => {
    setRows((prev) =>
      prev
        .filter((r) => r.id !== id)
        .map((r, i) => ({ ...r, sortOrder: i + 1 }))
    )
  }

  // Filters applied to rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (
        filters.costCenterKey &&
        !r.costCenter.toLowerCase().includes(filters.costCenterKey.toLowerCase())
      )
        return false
      if (
        filters.costCenterName &&
        !r.costCenterName.toLowerCase().includes(filters.costCenterName.toLowerCase())
      )
        return false
      if (filters.campus && r.campus !== filters.campus) return false
      if (filters.functionalArea && r.functionalArea !== filters.functionalArea)
        return false
      if (filters.unitGrouping && r.unitGrouping !== filters.unitGrouping) return false
      if (
        filters.department &&
        !r.unit.toLowerCase().includes(filters.department.toLowerCase())
      )
        return false
      if (filters.floatPool) {
        if (filters.floatPool === "true" && !r.floatPool) return false
        if (filters.floatPool === "false" && r.floatPool) return false
      }
      if (filters.unitOfService && r.unitOfService !== filters.unitOfService)
        return false
      return true
    })
  }, [rows, filters])


  // Drag & drop (works on filtered view, updates underlying rows)
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    const sourceRow = filteredRows[sourceIndex]
    const destRow = filteredRows[destIndex]

    if (!sourceRow) return

    setRows((prev) => {
      const copy = [...prev]
      const fromIndex = copy.findIndex((r) => r.id === sourceRow.id)
      let toIndex = destRow
        ? copy.findIndex((r) => r.id === destRow.id)
        : copy.length - 1

      if (fromIndex === -1) return prev
      if (toIndex === -1) toIndex = copy.length - 1

      const [moved] = copy.splice(fromIndex, 1)
      copy.splice(toIndex, 0, moved)

      return copy.map((r, i) => ({ ...r, sortOrder: i + 1 }))
    })
  }

  // Push to context
  useEffect(() => {
    updateFacilitySetup(rows)
  }, [rows, updateFacilitySetup])

  const handleContinue = () => {
    onNext?.()
    onSetupComplete?.()
  }

  // Helpers for filters
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilter = (key: keyof Filters) => {
    setFilters((prev) => ({ ...prev, [key]: key === "floatPool" ? "" : "" }))
    setOpenFilter(null)
  }

  const clearAllFilters = () => {
    setFilters({
      costCenterKey: "",
      costCenterName: "",
      campus: "",
      functionalArea: "",
      unitGrouping: "",
      department: "",
      floatPool: "",
      unitOfService: "",
    })
    setOpenFilter(null)
  }

  const uniqueValues = (getter: (r: CostCenterRow) => string) =>
    Array.from(new Set(rows.map(getter).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    )
    
  
  // Render
  return (
    <Card title="Facility Setup">
      <div id="filter-menu-container" className="relative z-50"></div>
      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
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

        <Button
          variant="ghost"
          onClick={() => {
            setRows([])
            setWarning(null)
          }}
        >
          Clear All
        </Button>

        {warning && <span className="text-sm text-gray-600">{warning}</span>}

        {(
          filters.costCenterKey ||
          filters.costCenterName ||
          filters.campus ||
          filters.functionalArea ||
          filters.unitGrouping ||
          filters.department ||
          filters.floatPool ||
          filters.unitOfService
        ) && (
          <Button variant="ghost" onClick={clearAllFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto relative">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="facility-rows">
            {(droppableProvided: DroppableProvided) => (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>     
                    {/* Drag */}
                    <th className="px-2 py-2 border w-10 text-left">Drag</th>

                    {/* Cost Center Key */}
                    <th className="px-2 py-2 border min-w-[110px] relative text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span>Cost Center Key</span>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          title="Filter by cost center key"
                          onClick={() =>
                            setOpenFilter(
                              openFilter === "costCenterKey"
                                ? null
                                : "costCenterKey"
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                      {openFilter === "costCenterKey" && (
                        <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 mt-1 right-0 w-56">
                          <input
                            type="text"
                            title="Filter by cost center key"
                            placeholder="Contains…"
                            className="w-full border rounded-md px-2 py-1 text-xs mb-2"
                            value={filters.costCenterKey}
                            onChange={(e) =>
                              handleFilterChange("costCenterKey", e.target.value)
                            }
                          />
                          <Button
                            variant="ghost"
                            onClick={() => clearFilter("costCenterKey")}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </th>

                    {/* Cost Center Name */}
                    <th className="px-2 py-2 border min-w-[130px] relative text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span>Cost Center Name</span>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          title="Filter by cost center name"
                          onClick={() =>
                            setOpenFilter(
                              openFilter === "costCenterName"
                                ? null
                                : "costCenterName"
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                      {openFilter === "costCenterName" && (
                        <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 mt-1 right-0 w-56">
                          <input
                            type="text"
                            title="Filter by cost center name"
                            placeholder="Contains…"
                            className="w-full border rounded-md px-2 py-1 text-xs mb-2"
                            value={filters.costCenterName}
                            onChange={(e) =>
                              handleFilterChange("costCenterName", e.target.value)
                            }
                          />
                          <Button
                            variant="ghost"
                            onClick={() => clearFilter("costCenterName")}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </th>

                    {/* Campus */}
                    <th className="px-2 py-2 border min-w-[130px] relative text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span>Campus</span>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          title="Filter by campus"
                          onClick={() =>
                            setOpenFilter(openFilter === "campus" ? null : "campus")
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                      {openFilter === "campus" && (
                        <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 mt-1 right-0 w-56">
                          <select
                            title="Filter by campus"
                            className="w-full border rounded-md px-2 py-1 text-xs mb-2"
                            value={filters.campus}
                            onChange={(e) =>
                              handleFilterChange("campus", e.target.value)
                            }
                          >
                            <option value="">All campuses</option>
                            {uniqueValues((r) => r.campus).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            onClick={() => clearFilter("campus")}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </th>

                    {/* Functional Area */}
                    <th className="px-2 py-2 border min-w-[160px] relative text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span>Functional Area</span>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          title="Filter by functional area"
                          onClick={() =>
                            setOpenFilter(
                              openFilter === "functionalArea"
                                ? null
                                : "functionalArea"
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                      {openFilter === "functionalArea" && (
                        <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 mt-1 right-0 w-56">
                          <select
                            title="Filter by functional area"
                            className="w-full border rounded-md px-2 py-1 text-xs mb-2"
                            value={filters.functionalArea}
                            onChange={(e) =>
                              handleFilterChange("functionalArea", e.target.value)
                            }
                          >
                            <option value="">All functional areas</option>
                            {uniqueValues((r) => r.functionalArea).map((fa) => (
                              <option key={fa} value={fa}>
                                {fa}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            onClick={() => clearFilter("functionalArea")}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </th>

                    {/* Unit Grouping */}
                    <th className="px-2 py-2 border min-w-[170px] relative text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span>Unit Grouping</span>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          title="Filter by unit grouping"
                          onClick={() =>
                            setOpenFilter(
                              openFilter === "unitGrouping"
                                ? null
                                : "unitGrouping"
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                      {openFilter === "unitGrouping" && (
                        <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 mt-1 right-0 w-56">
                          <select
                            title="Filter by unit grouping"
                            className="w-full border rounded-md px-2 py-1 text-xs mb-2"
                            value={filters.unitGrouping}
                            onChange={(e) =>
                              handleFilterChange("unitGrouping", e.target.value)
                            }
                          >
                            <option value="">All unit groupings</option>
                            {uniqueValues((r) => r.unitGrouping).map((ug) => (
                              <option key={ug} value={ug}>
                                {ug}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            onClick={() => clearFilter("unitGrouping")}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </th>

                    {/* Capacity */}
                    <th className="px-2 py-2 border w-[80px] text-left">Capacity</th>

                    {/* Float Pool */}
                    <th className="px-2 py-2 border w-[90px] relative text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span>Float Pool</span>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          title="Filter by float pool"        
                          onClick={() =>
                            setOpenFilter(
                              openFilter === "floatPool" ? null : "floatPool"
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                      {openFilter === "floatPool" && (
                        <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 mt-1 right-0 w-56">
                          <select
                            title="Filter by float pool"
                            className="w-full border rounded-md px-2 py-1 text-xs mb-2"
                            value={filters.floatPool}
                            onChange={(e) =>
                              handleFilterChange(
                                "floatPool",
                                e.target.value as Filters["floatPool"]
                              )
                            }
                          >
                            <option value="">All units</option>
                            <option value="true">Float pools only</option>
                            <option value="false">Non-float units</option>
                          </select>
                          <Button
                            variant="ghost"
                            onClick={() => clearFilter("floatPool")}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </th>

                    {/* Pool Participation */}
                    <th className="px-2 py-2 border min-w-[220px] max-w-[260px] text-left">
                      Pool Participation
                    </th>

                    {/* Unit of Service */}
                    <th className="px-2 py-2 border min-w-[150px] relative text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span>Unit of Service</span>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          title="Filter by unit of service"
                          onClick={() =>
                            setOpenFilter(
                              openFilter === "unitOfService"
                                ? null
                                : "unitOfService"
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                      {openFilter === "unitOfService" && (
                        <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 mt-1 right-0 w-56">
                          <select
                            title="Filter by unit of service"
                            className="w-full border rounded-md px-2 py-1 text-xs mb-2"
                            value={filters.unitOfService}
                            onChange={(e) =>
                              handleFilterChange("unitOfService", e.target.value)
                            }
                          >
                            <option value="">All UOS</option>
                            {unitOfServiceOptions.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                            {/* fallbacks in case no rows yet */}
                            {!unitOfServiceOptions.length && (
                              <>
                                <option value="Patient Days">Patient Days</option>
                                <option value="Visits">Visits</option>
                                <option value="Cases">Cases</option>
                                <option value="N/A">N/A</option>
                              </>
                            )}
                          </select>
                          <Button
                            variant="ghost"
                            onClick={() => clearFilter("unitOfService")}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </th>

                    {/* Actions */}
                    <th className="px-2 py-2 border w-[100px] text-left">Actions</th>
                  </tr>
                </thead>

                <tbody
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                >
                  {filteredRows.map((row, idx) => (
                    <Draggable
                      key={row.id}
                      draggableId={row.id}
                      index={idx}
                    >
                      {(draggableProvided: DraggableProvided) => (
                        <tr
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          {/* Drag handle */}
                          <td className="px-2 py-2 border w-10">
                            <div
                              {...draggableProvided.dragHandleProps}
                              className="cursor-grab text-lg"
                              title="Drag to reorder"
                            >
                              ⠿
                            </div>
                          </td>


                          {/* Cost Center Key */}
                          <td className="px-2 py-2 border min-w-[110px]">
                            <Input
                              id={`cc-key-${row.id}`}
                              value={row.costCenter}
                              onChange={(e) =>
                                updateRow(row.id, "costCenter", e.target.value)
                              }
                            />
                          </td>

                          {/* Cost Center Name */}
                          <td className="px-2 py-2 border min-w-[130px]">
                            <Input
                              id={`cc-name-${row.id}`}
                              value={row.costCenterName}
                              onChange={(e) =>
                                updateRow(row.id, "costCenterName", e.target.value)
                              }
                            />
                          </td>

                          {/* Campus */}
                          <td className="px-2 py-2 border min-w-[130px]">
                            <Select
                              id={`campus-${row.id}`}
                              value={row.campus}
                              onChange={(e) =>
                                updateRow(row.id, "campus", e.target.value)
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

                          {/* Functional Area with + modal */}
                          <td className="px-2 py-2 border min-w-[160px]">
                            <div className="flex items-center gap-2">
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
                              <Button
                                variant="ghost"
                                title="Add new functional area"
                                onClick={() => {
                                  setTargetRowId(row.id)
                                  setShowNewFA(true)
                                  setNewFAName("")
                                }}
                              >
                                +
                              </Button>
                            </div>
                          </td>

                          {/* Unit Grouping (keep inline 'type new') */}
                          <td className="px-2 py-2 border min-w-[170px]">
                            <Select
                              id={`ug-${row.id}`}
                              value={row.unitGrouping}
                              onChange={(e) =>
                                updateRow(row.id, "unitGrouping", e.target.value)
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
                                updateRow(row.id, "unitGrouping", e.target.value)
                              }
                            />
                          </td>

                          {/* Capacity */}
                          <td className="px-2 py-2 border w-[80px] text-center">
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
                                  row.capacity === "N/A" ? "" : String(row.capacity)
                                }
                                onChange={(e) =>
                                  updateRow(
                                    row.id,
                                    "capacity",
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value) || 0
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* Float Pool */}
                          <td className="px-2 py-2 border w-[90px] text-center">
                            <input
                              type="checkbox"
                              title="Toggle float pool"
                              aria-label="Toggle float pool"
                              checked={row.floatPool}
                              onChange={(e) =>
                                updateRow(row.id, "floatPool", e.target.checked)
                              }
                            />
                          </td>

                          {/* Pool Participation */}
                          <td className="px-2 py-2 border min-w-[220px] max-w-[260px] align-top">
                            {row.floatPool ? (
                              <input
                                title="Not applicable"
                                disabled
                                value="N/A"
                                className="w-full border border-gray-300 rounded-md px-2 py-1 bg-gray-100 text-gray-400 text-sm"
                              />
                            ) : floatPoolOptions.length === 0 ? (
                              <div className="text-gray-400 text-sm italic px-2 py-2">
                                No float pools available
                              </div>
                            ) : (
                              (() => {
                                const campusPools = floatPoolOptions.filter(
                                  (opt) =>
                                    opt.campus === row.campus &&
                                    opt.key !== row.costCenter
                                )
                                const regionalPools = floatPoolOptions.filter(
                                  (opt) =>
                                    opt.campus !== row.campus &&
                                    opt.key !== row.costCenter
                                )

                                return (
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
                                    {campusPools.length > 0 && (
                                      <optgroup label="Campus Float Pools">
                                        {campusPools.map((opt) => (
                                          <option
                                            key={opt.key}
                                            value={opt.key}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    {regionalPools.length > 0 && (
                                      <optgroup label="Regional Float Pools">
                                        {regionalPools.map((opt) => (
                                          <option
                                            key={opt.key}
                                            value={opt.key}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                )
                              })()
                            )}
                          </td>

                          {/* Unit of Service */}
                          <td className="px-2 py-2 border min-w-[150px]">
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
                                <option value="">-- Unit of Service --</option>
                                <option value="Patient Days">Patient Days</option>
                                <option value="Visits">Visits</option>
                                <option value="Cases">Cases</option>
                                <option value="N/A">N/A</option>
                              </Select>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-2 py-2 border w-[100px]">
                            <Button variant="ghost" onClick={() => deleteRow(row.id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}

                  {droppableProvided.placeholder}
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
        Note: Cost Center Name is initialized from the Department (Unit) name when
        importing from Excel. You can edit it in the table at any time.
      </p>

      {/* New Functional Area Modal */}
      {showNewFA && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-[min(400px,90vw)] p-6">
            <h3 className="text-lg font-semibold mb-4">
              Add New Functional Area
            </h3>

            <Input
              id="new-functional-area"
              label="Functional Area Name"
              placeholder="e.g. Nursing, ED, Radiology"
              value={newFAName}
              onChange={(e) => setNewFAName(e.target.value)}
            />

            <div className="flex justify-end mt-6 gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewFA(false)
                  setNewFAName("")
                  setTargetRowId(null)
                }}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                disabled={!newFAName.trim()}
                onClick={() => {
                  const cleaned = newFAName.trim()
                  if (!cleaned) return

                  if (targetRowId) {
                    updateRow(targetRowId, "functionalArea", cleaned)
                  }

                  setShowNewFA(false)
                  setNewFAName("")
                  setTargetRowId(null)
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
