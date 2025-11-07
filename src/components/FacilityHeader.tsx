import { useEffect, useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import { useApp } from "@/store/AppContext"
import * as XLSX from "xlsx"

/**
 * Expected Excel headers (exactly as in your sheet):
 *   Facility | Unit | Functional Area
 * Optional headers (if later added):
 *   Cost Center | Capacity
 *
 * When Cost Center / Capacity are missing, placeholders are generated:
 *   Cost Center: CC-001, CC-002, ...
 *   Capacity: a deterministic 15–45 based on Unit text (so it stays stable)
 */

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
  // allow any extra columns you add later
  [extra: string]: any
}

export default function FacilityHeader({ onNext, onSetupComplete }: Props) {
  const { updateFacilitySetup } = useApp()

  // Raw rows from Excel (with placeholders applied on load)
  const [rows, setRows] = useState<ExcelRow[]>([])
  const [fileLoaded, setFileLoaded] = useState(false)

  // Dropdown option buckets
  const [facilities, setFacilities] = useState<string[]>([])
  const [functionalAreas, setFunctionalAreas] = useState<string[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [costCenters, setCostCenters] = useState<string[]>([])

  // Manual-add Functional Area
  const [newFunctionalArea, setNewFunctionalArea] = useState("")

  // Main form
  const [form, setForm] = useState({
    facility: "",
    functionalArea: "",
    unit: "",
    costCenter: "",
    bedCount: "", // Capacity typed by user (for selected unit), also shown conditionally
  })

  const [warning, setWarning] = useState<string | null>(null)

  // --- Helpers --------------------------------------------------------------

  // Deterministic capacity placeholder 15..45 based on unit name
  const capacityPlaceholder = (unit: string) => {
    if (!unit) return 20
    let h = 0
    for (let i = 0; i < unit.length; i++) {
      h = (h * 31 + unit.charCodeAt(i)) % 997
    }
    return 15 + (h % 31) // 15..45
  }

  // Create CC-xxx placeholder
  const ccPlaceholder = (index: number) => {
    const n = String(index + 1).padStart(3, "0")
    return `CC-${n}`
  }

  // Normalize, fill placeholders, and keep ALL columns
  const normalizeRows = (raw: any[]): ExcelRow[] => {
    // Build unique map for units to assign stable CC placeholders
    const unitSeen = new Map<string, number>()
    let ccCounter = 0

    return raw
      .filter((r) => r && (r.Facility || r["Facility"]) && (r.Unit || r["Unit"]))
      .map((r) => {
        const Facility = r.Facility ?? r["Facility"] ?? ""
        const Unit = r.Unit ?? r["Unit"] ?? ""
        const FunctionalArea = r["Functional Area"] ?? r.FunctionalArea ?? ""

        // keep any extra columns
        const copy: ExcelRow = { ...r, Facility, Unit, "Functional Area": FunctionalArea }

        // Cost Center
        let cc = r["Cost Center"] ?? r.CC ?? r.CostCenter
        if (!cc || String(cc).trim() === "") {
          if (!unitSeen.has(Unit)) unitSeen.set(Unit, ccCounter++)
          cc = ccPlaceholder(unitSeen.get(Unit)!)
          copy["Cost Center"] = cc
        } else {
          copy["Cost Center"] = String(cc)
        }

        // Capacity
        let cap = r.Capacity
        if (cap === undefined || cap === null || String(cap).trim?.() === "") {
          cap = capacityPlaceholder(Unit)
        }
        // store numeric capacity when possible
        copy.Capacity = typeof cap === "string" ? Number(cap) || cap : cap

        return copy
      })
  }

  // Nursing detection based on the selected unit/area text
  const isNursingUnit = useMemo(() => {
    const text = (form.unit + " " + form.functionalArea).toLowerCase()
    return /(nurse|nursing|icu|med|surg|tele|telemetry|ed|er|rehab|labor|delivery|inpatient)/i.test(
      text
    )
  }, [form.unit, form.functionalArea])

  // --- Excel Load / Export --------------------------------------------------

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

      const normalized = normalizeRows(json)
      setRows(normalized)
      setFileLoaded(true)

      // seed top-level facilities from file
      const uFacilities = Array.from(new Set(normalized.map((r) => r.Facility))).filter(Boolean)
      setFacilities(uFacilities)

      // reset form & dependent options
      setFunctionalAreas([])
      setUnits([])
      setCostCenters([])
      setForm({ facility: "", functionalArea: "", unit: "", costCenter: "", bedCount: "" })
      setWarning(null)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExportExcel = () => {
    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Facility Mapping")
    XLSX.writeFile(wb, "facility_mapping.xlsx")
  }

  // --- Cascading Filters ----------------------------------------------------

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      setWarning(null)

      if (key === "facility") {
        // Functional Areas available under this Facility
        const fa = Array.from(
          new Set(rows.filter((r) => r.Facility === value).map((r) => r["Functional Area"]))
        ).filter(Boolean)
        setFunctionalAreas(fa)

        // reset lower levels
        setUnits([])
        setCostCenters([])
        next.functionalArea = ""
        next.unit = ""
        next.costCenter = ""
        next.bedCount = ""
      }

      if (key === "functionalArea") {
        // Units under this Facility + Functional Area
        const us = Array.from(
          new Set(
            rows
              .filter(
                (r) => r.Facility === next.facility && r["Functional Area"] === value
              )
              .map((r) => r.Unit)
          )
        ).filter(Boolean)
        setUnits(us)

        setCostCenters([])
        next.unit = ""
        next.costCenter = ""
        next.bedCount = ""
      }

      if (key === "unit") {
        // CC choices for that unit (usually one)
        const ccs = Array.from(
          new Set(
            rows
              .filter(
                (r) =>
                  r.Facility === next.facility &&
                  r["Functional Area"] === next.functionalArea &&
                  r.Unit === value
              )
              .map((r) => String(r["Cost Center"]))
          )
        ).filter(Boolean)
        setCostCenters(ccs)
        next.costCenter = ccs[0] || ""

        // default the bedCount to the sheet's Capacity (placeholder already applied)
        const found = rows.find(
          (r) =>
            r.Facility === next.facility &&
            r["Functional Area"] === next.functionalArea &&
            r.Unit === value
        )
        if (found?.Capacity !== undefined && found?.Capacity !== null) {
          next.bedCount = String(found.Capacity)
        } else {
          next.bedCount = String(capacityPlaceholder(value))
        }
      }

      if (key === "costCenter") {
        // nothing extra
      }

      return next
    })
  }

  // --- Add Functional Area Manually ----------------------------------------

  const addFunctionalArea = () => {
    const val = newFunctionalArea.trim()
    if (!val) return
    setFunctionalAreas((prev) =>
      prev.includes(val) ? prev : [...prev, val].sort((a, b) => a.localeCompare(b))
    )
    setForm((p) => ({ ...p, functionalArea: val }))
    setNewFunctionalArea("")
  }

  // --- App Context Sync -----------------------------------------------------

  useEffect(() => {
    if (!form.facility || !form.unit) return
    updateFacilitySetup({
      facility: form.facility,
      functionalArea: form.functionalArea,
      department: form.unit, // Unit is our "Department"
      costCenter: form.costCenter,
      bedCount: isNursingUnit ? Number(form.bedCount) || 0 : 0,
      // include everything we know so far for downstream steps
      source: "excel",
    })
  }, [form, isNursingUnit])

  // --- View Units Modal -----------------------------------------------------

  const [showUnits, setShowUnits] = useState(false)

  const unitsForSelectedFacility = useMemo(() => {
    if (!form.facility) return []
    return rows
      .filter((r) => r.Facility === form.facility)
      .map((r) => ({
        unit: r.Unit,
        area: r["Functional Area"],
        cc: String(r["Cost Center"]),
        cap: r.Capacity ?? capacityPlaceholder(r.Unit),
      }))
  }, [rows, form.facility])

  const handleContinue = () => {
    if (onNext) onNext()
    if (onSetupComplete) onSetupComplete()
  }

  // -------------------------------------------------------------------------

  return (
    <Card title="HIRA Staffing Tool">
      {/* Upload / Export */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label htmlFor="fileUpload" className="sr-only">Upload Excel</label>
        <input
          id="fileUpload"
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          title="Upload Excel file"
        />
        <Button variant="ghost" onClick={handleExportExcel} disabled={!rows.length}>
          Export Excel
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowUnits(true)}
          disabled={!form.facility || !rows.length}
        >
          View Units
        </Button>
      </div>

      {/* Form Grid (3 cols to match your UI) */}
      <div className="grid grid-cols-3 gap-4">
        {/* Facility */}
        <Select
          id="facility"
          label="Facility"
          value={form.facility}
          onChange={(e) => handleChange("facility", e.target.value)}
          disabled={!fileLoaded}
        >
          <option value="">{fileLoaded ? "-- Select Facility --" : "Upload Excel to begin"}</option>
          {facilities.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>

        {/* Functional Area */}
        <div className="flex flex-col">
          <Select
            id="functionalArea"
            label="Functional Area"
            value={form.functionalArea}
            onChange={(e) => handleChange("functionalArea", e.target.value)}
            disabled={!form.facility}
          >
            <option value="">-- Select Functional Area --</option>
            {functionalAreas.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>

          {/* Add-new inline control */}
          <div className="flex gap-2 mt-2">
            <Input
              id="newFunctionalArea"
              label=""
              placeholder="Add new Functional Area"
              value={newFunctionalArea}
              onChange={(e) => setNewFunctionalArea(e.target.value)}
            />
            <Button onClick={addFunctionalArea} disabled={!newFunctionalArea.trim()}>
              Add
            </Button>
          </div>
        </div>

        {/* Unit (Department) */}
        <Select
          id="unit"
          label="Department (Unit)"
          value={form.unit}
          onChange={(e) => handleChange("unit", e.target.value)}
          disabled={!form.functionalArea}
        >
          <option value="">-- Select Unit --</option>
          {units.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>

        {/* Cost Center */}
        <Select
          id="costCenter"
          label="Cost Center"
          value={form.costCenter}
          onChange={(e) => handleChange("costCenter", e.target.value)}
          disabled={!form.unit}
        >
          <option value="">-- Select Cost Center --</option>
          {costCenters.map((cc) => (
            <option key={cc} value={cc}>
              {cc}
            </option>
          ))}
        </Select>

        {/* Capacity / Bed Count */}
        {isNursingUnit ? (
          <Input
            id="bedCount"
            label="Capacity"
            type="number"
            min={0}
            value={form.bedCount}
            onChange={(e) => handleChange("bedCount", e.target.value)}
            placeholder=""
          />
        ) : (
          <div className="col-span-1 flex flex-col justify-end">
            <label className="text-sm font-medium text-gray-600 mb-1">Capacity</label>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-400"
              disabled
              placeholder="N/A - not applicable"
            />
          </div>
        )}
      </div>

      {/* Warning */}
      {warning && (
        <p className="text-yellow-700 bg-yellow-50 px-3 py-2 rounded mt-3 text-sm">⚠️ {warning}</p>
      )}

      {/* Continue */}
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!form.facility || !form.unit || !form.costCenter}
        >
          Continue →
        </Button>
      </div>

      {/* Simple "View Units" modal */}
      {showUnits && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-[min(900px,92vw)] max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Units in: <span className="font-bold">{form.facility || "—"}</span>
              </h3>
              <Button variant="ghost" onClick={() => setShowUnits(false)}>
                Close
              </Button>
            </div>

            <div className="p-4">
              {!form.facility ? (
                <p className="text-sm text-gray-500">Select a Facility to view units.</p>
              ) : unitsForSelectedFacility.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border">Unit</th>
                        <th className="px-3 py-2 text-left border">Functional Area</th>
                        <th className="px-3 py-2 text-left border">Cost Center</th>
                        <th className="px-3 py-2 text-left border">Capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitsForSelectedFacility.map((u, idx) => (
                        <tr key={`${u.unit}-${idx}`} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 border">{u.unit}</td>
                          <td className="px-3 py-2 border">{u.area}</td>
                          <td className="px-3 py-2 border">{u.cc}</td>
                          <td className="px-3 py-2 border">{u.cap}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No units found in this Facility.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
