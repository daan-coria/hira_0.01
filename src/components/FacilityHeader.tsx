import { useEffect, useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useApp } from "@/store/AppContext"
import * as XLSX from "xlsx"

type Props = {
  onNext?: () => void
  onSetupComplete?: () => void
}

type UnitOfService = "Patient Days" | "Visits" | "Cases" | "N/A" | ""

type CostCenterRow = {
  id: string
  facility: string
  campus: string
  functionalArea: string
  unit: string
  costCenter: string // key
  capacity: number | "N/A"
  costCenterName: string
  unitGrouping: string
  floatPool: boolean
  poolParticipation: string[] // cost center keys of pools
  unitOfService: UnitOfService
  sortOrder: number
}

// Raw Excel row we care about
type ExcelRow = {
  Facility: string
  Unit: string
  "Functional Area": string
  "Cost Center"?: string | number
  Capacity?: number | string
  [extra: string]: any
}

// Simple capacity placeholder to avoid empty capacities
const capacityPlaceholder = (unit: string) => {
  if (!unit) return 20
  let h = 0
  for (let i = 0; i < unit.length; i++) h = (h * 31 + unit.charCodeAt(i)) % 997
  return 15 + (h % 31)
}

// Generate a quick random-ish ID
const makeId = () => Math.random().toString(36).slice(2, 10)

export default function FacilityHeader({ onNext, onSetupComplete }: Props) {
  const { updateFacilitySetup } = useApp()

  const [rows, setRows] = useState<CostCenterRow[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Derived lists (for dropdowns)
  // ---------------------------------------------------------------------------

  const campusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.campus).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [rows]
  )

  const functionalAreaOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.functionalArea).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [rows]
  )

  const unitGroupingOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.unitGrouping).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [rows]
  )

  // Float pool rows used in "pool pulls from" multi-select
  const floatPoolOptions = useMemo(
    () =>
      rows
        .filter((r) => r.floatPool)
        .map((r) => ({
          key: r.costCenter,
          label: `${r.costCenter} – ${r.costCenterName || r.unit || "Unnamed"}`,
        })),
    [rows]
  )

  // ---------------------------------------------------------------------------
  // Excel handling
  // ---------------------------------------------------------------------------

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

        // We read as JSON with defval to avoid undefined
        const raw = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" })
        if (!raw.length) throw new Error("Sheet is empty or unreadable")

        // Normalize Excel headers (support some variants)
        const normalized: ExcelRow[] = raw
          .map((r) => {
            const Facility = (r.Facility ?? (r as any).facility ?? "").toString().trim()
            const Unit = (r.Unit ?? (r as any).unit ?? "").toString().trim()
            const FunctionalArea = (
              r["Functional Area"] ??
              (r as any)["functional area"] ??
              (r as any).FunctionalArea ??
              ""
            )
              .toString()
              .trim()

            if (!Facility || !Unit) return null

            let cc =
              r["Cost Center"] ??
              (r as any).CostCenter ??
              (r as any)["cost center"] ??
              (r as any).CC

            if (cc === null || cc === undefined || `${cc}`.trim() === "") {
              cc = `${Facility}-${Unit}` // fallback before we assign proper key later
            }

            let cap = r.Capacity ?? (r as any).capacity ?? ""
            if (cap === "" || cap === null || cap === undefined) {
              cap = capacityPlaceholder(Unit)
            }

            const Capacity =
              typeof cap === "string" ? (Number(cap) || capacityPlaceholder(Unit)) : cap

            return {
              Facility,
              Unit,
              "Functional Area": FunctionalArea,
              "Cost Center": cc,
              Capacity,
            } as ExcelRow
          })
          .filter(Boolean) as ExcelRow[]

        // Convert to CostCenterRow[]
        let sortCounter = 1
        const mapped: CostCenterRow[] = normalized.map((r) => ({
          id: makeId(),
          facility: r.Facility,
          campus: r.Facility, // right now campus mirrors Facility; editable in the grid
          functionalArea: r["Functional Area"],
          unit: r.Unit,
          costCenter: String(r["Cost Center"] ?? "").trim(), // key
          capacity:
            typeof r.Capacity === "number"
              ? r.Capacity
              : Number(r.Capacity) || capacityPlaceholder(r.Unit),
          // NOTE per Q2: default name = Unit (can be edited later)
          costCenterName: r.Unit,
          unitGrouping: "",
          floatPool: false,
          poolParticipation: [],
          unitOfService: "Patient Days",
          sortOrder: sortCounter++,
        }))

        setRows(mapped)
        setWarning(`✅ Loaded ${mapped.length} rows from "${sheetName}".`)
      } catch (err: any) {
        console.error("Excel parse error:", err)
        setRows([])
        setWarning(`❌ ${err?.message || "Failed to read Excel file."}`)
      } finally {
        setUploading(false)
      }
    }

    reader.readAsArrayBuffer(selectedFile)
  }

  const handleExportExcel = () => {
    if (!rows.length) return
    const exportRows = rows.map((r) => ({
      Facility: r.facility,
      Campus: r.campus,
      "Functional Area": r.functionalArea,
      Unit: r.unit,
      "Cost Center Key": r.costCenter,
      "Cost Center Name": r.costCenterName,
      Capacity: r.capacity,
      "Unit Grouping": r.unitGrouping,
      "Float Pool": r.floatPool ? "Y" : "N",
      "Pool Participation": r.poolParticipation.join(", "),
      "Unit of Service": r.unitOfService,
      "Sort Order": r.sortOrder,
    }))
    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Facility Setup")
    XLSX.writeFile(wb, "facility_setup.xlsx")
  }

  // ---------------------------------------------------------------------------
  // Row helpers
  // ---------------------------------------------------------------------------

  const updateRow = <K extends keyof CostCenterRow>(
    id: string,
    key: K,
    value: CostCenterRow[K]
  ) => {
    setRows((prev) =>
      prev
        .map((r) => {
          if (r.id !== id) return r
          let next: CostCenterRow = { ...r, [key]: value }

          // Float pool logic: if floatPool is true, some fields become N/A
          if (key === "floatPool" && typeof value === "boolean") {
            if (value) {
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

          // If capacity manually edited on a float pool row, keep it N/A
          if (next.floatPool) {
            next.capacity = "N/A"
            next.unitOfService = "N/A"
            next.poolParticipation = []
          }

          return next
        })
        // keep array ordered by sortOrder (in case we changed sortOrder directly)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    )
  }

  const addRow = () => {
    setRows((prev) => {
      const maxSort = prev.reduce((m, r) => Math.max(m, r.sortOrder), 0)
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
      return [...prev, row]
    })
  }

  const deleteRow = (id: string) => {
    setRows((prev) =>
      prev
        .filter((r) => r.id !== id)
        .map((r, idx) => ({ ...r, sortOrder: idx + 1 }))
    )
  }

  const moveRow = (id: string, direction: "up" | "down") => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id)
      if (idx === -1) return prev
      const target = direction === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev

      const copy = [...prev]
      const tmp = copy[idx]
      copy[idx] = copy[target]
      copy[target] = tmp

      return copy.map((r, i) => ({ ...r, sortOrder: i + 1 }))
    })
  }

  const clearAll = () => {
    setRows([])
    setWarning(null)
  }

  // Handle multi-select pool participation
  const handlePoolParticipationChange = (id: string, values: string[]) => {
    updateRow(id, "poolParticipation", values)
  }

  // ---------------------------------------------------------------------------
  // Persist to AppContext whenever rows change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // You can adjust this shape in AppContext to whatever you need
    updateFacilitySetup(rows)
  }, [rows, updateFacilitySetup])

  // ---------------------------------------------------------------------------
  // Continue handler
  // ---------------------------------------------------------------------------

  const handleContinue = () => {
    if (onNext) onNext()
    if (onSetupComplete) onSetupComplete()
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card title="Facility Setup">
      {/* Top controls -------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="sr-only" htmlFor="facilityUpload">
          Upload Facility Excel
        </label>
        <input
          id="facilityUpload"
          type="file"
          accept=".xlsx"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />

        <Button
          variant="primary"
          disabled={!selectedFile || uploading}
          onClick={handleUploadExcel}
        >
          {uploading ? "Parsing Excel..." : "Upload Excel"}
        </Button>

        <Button variant="ghost" disabled={!rows.length} onClick={handleExportExcel}>
          Export Excel
        </Button>

        <Button variant="ghost" onClick={addRow}>
          Add Cost Center
        </Button>

        <Button variant="ghost" disabled={!rows.length} onClick={clearAll}>
          Clear All
        </Button>

        {warning && (
          <span className="text-sm text-gray-600 whitespace-pre-line">{warning}</span>
        )}
      </div>

      {/* Grid header --------------------------------------------------------- */}
      <div className="border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 border text-left">Sort</th>
              <th className="px-2 py-2 border text-left">Cost Center Key</th>
              <th className="px-2 py-2 border text-left">Cost Center Name</th>
              <th className="px-2 py-2 border text-left">Campus</th>
              <th className="px-2 py-2 border text-left">Functional Area</th>
              <th className="px-2 py-2 border text-left">Unit Grouping</th>
              <th className="px-2 py-2 border text-left">Department (Unit)</th>
              <th className="px-2 py-2 border text-left">Capacity</th>
              <th className="px-2 py-2 border text-left">Float Pool</th>
              <th className="px-2 py-2 border text-left">Pool Participation</th>
              <th className="px-2 py-2 border text-left">Unit of Service</th>
              <th className="px-2 py-2 border text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="px-3 py-4 text-center text-gray-500 bg-white"
                >
                  Upload an Excel file or click &quot;Add Cost Center&quot; to begin.
                </td>
              </tr>
            )}

            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {/* Sort / move ------------------------------------------------ */}
                <td className="px-2 py-2 border align-middle">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 w-6 text-center">
                      {row.sortOrder}
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        className="text-xs leading-none"
                        onClick={() => moveRow(row.id, "up")}
                        disabled={idx === 0}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="text-xs leading-none"
                        onClick={() => moveRow(row.id, "down")}
                        disabled={idx === rows.length - 1}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>

                {/* Cost Center Key ------------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  <Input
                    id={`cc-key-${row.id}`}
                    value={row.costCenter}
                    onChange={(e) => updateRow(row.id, "costCenter", e.target.value)}
                  />
                </td>

                {/* Cost Center Name ------------------------------------------ */}
                <td className="px-2 py-2 border align-middle">
                  <Input
                    id={`cc-name-${row.id}`}
                    value={row.costCenterName}
                    onChange={(e) => updateRow(row.id, "costCenterName", e.target.value)}
                  />
                </td>

                {/* Campus ----------------------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  <Select
                    id={`campus-${row.id}`}
                    value={row.campus}
                    onChange={(e) => updateRow(row.id, "campus", e.target.value)}
                  >
                    <option value="">-- Select Campus --</option>
                    {campusOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {/* Let user create on the fly by just typing later if needed */}
                  </Select>
                </td>

                {/* Functional Area ------------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  <Select
                    id={`fa-${row.id}`}
                    value={row.functionalArea}
                    onChange={(e) =>
                      updateRow(row.id, "functionalArea", e.target.value)
                    }
                  >
                    <option value="">-- Functional Area --</option>
                    {functionalAreaOptions.map((fa) => (
                      <option key={fa} value={fa}>
                        {fa}
                      </option>
                    ))}
                  </Select>
                  <Input
                    id={`fa-custom-${row.id}`}
                    className="mt-1"
                    placeholder="Or type new"
                    value={row.functionalArea}
                    onChange={(e) =>
                      updateRow(row.id, "functionalArea", e.target.value)
                    }
                  />
                </td>

                {/* Unit Grouping --------------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  <Select
                    id={`ug-${row.id}`}
                    value={row.unitGrouping}
                    onChange={(e) => updateRow(row.id, "unitGrouping", e.target.value)}
                  >
                    <option value="">-- Unit Grouping --</option>
                    {unitGroupingOptions.map((ug) => (
                      <option key={ug} value={ug}>
                        {ug}
                      </option>
                    ))}
                  </Select>
                  <Input
                    id={`ug-custom-${row.id}`}
                    className="mt-1"
                    placeholder="Or type new"
                    value={row.unitGrouping}
                    onChange={(e) => updateRow(row.id, "unitGrouping", e.target.value)}
                  />
                </td>

                {/* Department / Unit ----------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  <Input
                    id={`unit-${row.id}`}
                    value={row.unit}
                    onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                  />
                </td>

                {/* Capacity --------------------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  {row.floatPool ? (
                    <input
                      title="N/A for float pool"
                      className="w-full border border-gray-300 rounded-md px-2 py-1 bg-gray-100 text-gray-400 text-sm"
                      disabled
                      value="N/A"
                    />
                  ) : (
                    <Input
                      id={`cap-${row.id}`}
                      type="number"
                      min={0}
                      value={row.capacity === "N/A" ? "" : row.capacity}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "capacity",
                          e.target.value === ""
                            ? 0
                            : Number.isNaN(Number(e.target.value))
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                </td>

                {/* Float Pool toggle ----------------------------------------- */}
                <td className="px-2 py-2 border align-middle text-center">
                  <input
                    title="Float pool toggle"
                    type="checkbox"
                    checked={row.floatPool}
                    onChange={(e) => updateRow(row.id, "floatPool", e.target.checked)}
                  />
                </td>

                {/* Pool Participation (multi-select) ------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  {row.floatPool ? (
                    <input
                      className="w-full border border-gray-300 rounded-md px-2 py-1 bg-gray-100 text-gray-400 text-sm"
                      title="N/A for float pool"
                      disabled
                      value="N/A"
                    />
                  ) : (
                    <select
                      id={`poolParticipation-${row.id}`}
                      aria-label="Pool Participation"
                      multiple
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      value={row.poolParticipation}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions)
                        const values = options.map((o) => o.value)
                        handlePoolParticipationChange(row.id, values)
                      }}
                    >
                      {floatPoolOptions.length === 0 && (
                        <option disabled value="">
                          No float pools defined
                        </option>
                      )}
                      {floatPoolOptions
                        .filter((opt) => opt.key !== row.costCenter)
                        .map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                    </select>
                  )}
                </td>

                {/* Unit of Service ------------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  {row.floatPool ? (
                    <input
                      className="w-full border border-gray-300 rounded-md px-2 py-1 bg-gray-100 text-gray-400 text-sm"
                      title="N/A for float pool"        
                      disabled
                      value="N/A"
                    />
                  ) : (
                    <Select
                      id={`uos-${row.id}`}
                      value={row.unitOfService}
                      onChange={(e) =>
                        updateRow(row.id, "unitOfService", e.target.value as UnitOfService)
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

                {/* Actions ---------------------------------------------------- */}
                <td className="px-2 py-2 border align-middle">
                  <Button variant="ghost" onClick={() => deleteRow(row.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Continue button ------------------------------------------------------ */}
      <div className="flex justify-end mt-6">
        <Button variant="primary" onClick={handleContinue} disabled={!rows.length}>
          Continue →
        </Button>
      </div>

      {/* Note about Cost Center Name default --------------------------------- */}
      <p className="mt-4 text-xs text-gray-500">
        Note: Right now, the <span className="font-semibold">Cost Center Name</span> is
        initialized from the Department (Unit) name when rows are imported from Excel.
        You can edit it in the table at any time, and later we can change this default
        behavior if you want different naming logic.
      </p>
    </Card>
  )
}
