import { useEffect, useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import { useApp } from "@/store/AppContext"
import * as XLSX from "xlsx"

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

export default function FacilityHeader({ onNext, onSetupComplete }: Props) {
  const { updateFacilitySetup } = useApp()

  const [rows, setRows] = useState<ExcelRow[]>([])
  const [fileLoaded, setFileLoaded] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [facilities, setFacilities] = useState<string[]>([])
  const [functionalAreas, setFunctionalAreas] = useState<string[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [costCenters, setCostCenters] = useState<string[]>([])

  const [newFunctionalArea, setNewFunctionalArea] = useState("")

  const [form, setForm] = useState({
    facility: "",
    functionalArea: "",
    unit: "",
    costCenter: "",
    bedCount: "",
  })

  const [warning, setWarning] = useState<string | null>(null)
  const [showUnits, setShowUnits] = useState(false)

  // Placeholder generators ---------------------------------------------------
  const capacityPlaceholder = (unit: string) => {
    if (!unit) return 20
    let h = 0
    for (let i = 0; i < unit.length; i++) h = (h * 31 + unit.charCodeAt(i)) % 997
    return 15 + (h % 31)
  }
  const ccPlaceholder = (i: number) => `CC-${String(i + 1).padStart(3, "0")}`

  // Case/space-insensitive header index lookup
  const findCol = (hdr: string[], names: string[]) => {
    const norm = (s: any) => String(s ?? "").trim().toLowerCase()
    const H = hdr.map(norm)
    for (const name of names) {
      const i = H.indexOf(norm(name))
      if (i !== -1) return i
    }
    return -1
  }

  const normalizeRows = (raw: any[]): ExcelRow[] => {
    const unitSeen = new Map<string, number>()
    let ccCounter = 0
    return raw
      .filter((r) => r && (r.Facility || r["Facility"]) && (r.Unit || r["Unit"]))
      .map((r) => {
        const Facility = r.Facility ?? r["Facility"] ?? ""
        const Unit = r.Unit ?? r["Unit"] ?? ""
        const FunctionalArea = r["Functional Area"] ?? r.FunctionalArea ?? ""
        const copy: ExcelRow = { ...r, Facility, Unit, "Functional Area": FunctionalArea }

        let cc = r["Cost Center"] ?? r.CC ?? r.CostCenter
        if (!cc || String(cc).trim() === "") {
          if (!unitSeen.has(Unit)) unitSeen.set(Unit, ccCounter++)
          cc = ccPlaceholder(unitSeen.get(Unit)!)
          copy["Cost Center"] = cc
        } else copy["Cost Center"] = String(cc)

        let cap = r.Capacity
        if (!cap || String(cap).trim?.() === "") cap = capacityPlaceholder(Unit)
        copy.Capacity = typeof cap === "string" ? Number(cap) || cap : cap

        return copy
      })
  }

  const isNursingUnit = useMemo(() => {
    const text = (form.unit + " " + form.functionalArea).toLowerCase()
    return /(nurse|nursing|icu|med|surg|tele|telemetry|ed|er|rehab|labor|delivery|inpatient)/i.test(
      text
    )
  }, [form.unit, form.functionalArea])

  // --------------------------------------------------------------------------
  const handleExportExcel = () => {
    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Facility Mapping")
    XLSX.writeFile(wb, "facility_mapping.xlsx")
  }

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      setWarning(null)

      if (key === "facility") {
        const fa = Array.from(
          new Set(rows.filter((r) => r.Facility === value).map((r) => r["Functional Area"]))
        ).filter(Boolean)
        setFunctionalAreas(fa)
        setUnits([])
        setCostCenters([])
        next.functionalArea = ""
        next.unit = ""
        next.costCenter = ""
        next.bedCount = ""
      }

      if (key === "functionalArea") {
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

        const found = rows.find(
          (r) =>
            r.Facility === next.facility &&
            r["Functional Area"] === next.functionalArea &&
            r.Unit === value
        )
        next.bedCount = String(found?.Capacity ?? capacityPlaceholder(value))
      }

      return next
    })
  }

  const addFunctionalArea = () => {
    const val = newFunctionalArea.trim()
    if (!val) return
    setFunctionalAreas((prev) =>
      prev.includes(val) ? prev : [...prev, val].sort((a, b) => a.localeCompare(b))
    )
    setForm((p) => ({ ...p, functionalArea: val }))
    setNewFunctionalArea("")
  }

  useEffect(() => {
    if (!form.facility || !form.unit) return
    updateFacilitySetup({
      facility: form.facility,
      functionalArea: form.functionalArea,
      department: form.unit,
      costCenter: form.costCenter,
      bedCount: isNursingUnit ? Number(form.bedCount) || 0 : 0,
      source: "excel",
    })
  }, [form, isNursingUnit])

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

  // --------------------------------------------------------------------------
  return (
    <Card title="HIRA Staffing Tool">
      {/* Upload controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label htmlFor="fileUpload" className="sr-only">
          Upload Excel
        </label>
        <input
          id="fileUpload"
          type="file"
          accept=".xlsx"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          title="Upload Excel file"
        />

        <Button
          variant="primary"
          disabled={!selectedFile || uploading}
          onClick={() => {
            if (!selectedFile) return
            setUploading(true)
            const reader = new FileReader()
            reader.onload = (event) => {
              try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                // --- Parse Excel header-agnostically ---
                const rowsArray = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" })
                if (!rowsArray.length) throw new Error("Sheet is empty or unreadable")
                const header = rowsArray[0].map((h: string) => String(h).trim().toLowerCase())

                // helper to find column indices regardless of spacing/case
                const findCol = (names: string[]) =>
                  header.findIndex((h: string) => names.includes(h.toLowerCase()))

                const iFacility = findCol(["facility"])
                const iUnit = findCol(["unit", "department", "dept"])
                const iFA = findCol(["functional area", "functional_area", "functionalarea"])
                const iCC = findCol(["cost center", "cc", "costcenter"])
                const iCap = findCol(["capacity", "beds", "bed count", "bedcount"])

                if (iFacility === -1 || iUnit === -1 || iFA === -1) {
                  throw new Error("Missing required columns: Facility, Unit, or Functional Area")
                }

                const rawRows = rowsArray.slice(1).filter((r) => r && r.length)
                let ccCounter = 0
                const unitSeen = new Map<string, number>()

                const normalized = rawRows
                  .map((r) => {
                    const Facility = String(r[iFacility] ?? "").trim()
                    const Unit = String(r[iUnit] ?? "").trim()
                    const FunctionalArea = String(r[iFA] ?? "").trim()
                    if (!Facility || !Unit) return null

                    // Cost Center placeholder
                    let cc =
                      iCC !== -1 ? String(r[iCC] ?? "").trim() : ""
                    if (!cc) {
                      if (!unitSeen.has(Unit)) unitSeen.set(Unit, ccCounter++)
                      cc = `CC-${String(unitSeen.get(Unit)! + 1).padStart(3, "0")}`
                    }

                    // Capacity placeholder
                    let cap =
                      iCap !== -1 ? (r[iCap] ?? "") : ""
                    const Capacity =
                      cap === "" ? capacityPlaceholder(Unit)
                      : typeof cap === "string" ? Number(cap) || cap
                      : cap

                    return {
                      Facility,
                      Unit,
                      "Functional Area": FunctionalArea,
                      "Cost Center": cc,
                      Capacity,
                    }
                  })
                  .filter(Boolean) as ExcelRow[]

                if (!normalized.length)
                  throw new Error("No valid rows found after parsing.")

                setRows(normalized)
                setFileLoaded(true)
                const uniqueFacilities = Array.from(new Set(normalized.map((r) => r.Facility))).filter(
                  Boolean
                )
                setFacilities(uniqueFacilities)
                setFunctionalAreas([])
                setUnits([])
                setCostCenters([])
                setForm({
                  facility: "",
                  functionalArea: "",
                  unit: "",
                  costCenter: "",
                  bedCount: "",
                })
                setWarning(`✅ Loaded ${normalized.length} rows from "${sheetName}".`)
              } catch (err: any) {
                console.error("Excel parse error:", err)
                setRows([])
                setFacilities([])
                setFunctionalAreas([])
                setUnits([])
                setCostCenters([])
                setForm({
                  facility: "",
                  functionalArea: "",
                  unit: "",
                  costCenter: "",
                  bedCount: "",
                })
                setFileLoaded(false)
                setWarning(`❌ ${err?.message || "Failed to read Excel file."}`)
              } finally {
                setUploading(false)
              }
            }
            reader.readAsArrayBuffer(selectedFile)
          }}
        >
          {uploading ? "Parsing Excel..." : "Upload Excel"}
        </Button>

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

      {/* Form grid */}
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

        {/* Unit */}
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

        {/* Capacity */}
        {isNursingUnit ? (
          <Input
            id="bedCount"
            label="Capacity"
            type="number"
            min={0}
            value={form.bedCount}
            onChange={(e) => handleChange("bedCount", e.target.value)}
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

      {/* View Units modal */}
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
