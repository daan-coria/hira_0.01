import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MouseEvent as ReactMouseEvent,
} from "react"
import { useApp } from "@/store/AppContext"
import * as XLSX from "xlsx"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import ResourceRowItem from "@/components/ResourceRowItem"
import debounce from "lodash.debounce"
import Papa from "papaparse"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"
import AvailabilityDrawer from "@/components/AvailabilityDrawer"
import { AvailabilityEntry } from "@/utils/useAvailabilityCalculator"
import { ResourceRow } from "@/types/ResourceRow"

const WEEK_WIDTH = 100
const TOTAL_WEEKS_WIDTH = WEEK_WIDTH * 52

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ResourceInputCard({ onNext, onPrev }: Props) {
  // NOTE: now also pulling master from context (Option B)
  const { data, updateData, master } = useApp()

  const [rows, setRows] = useState<ResourceRow[]>([])
  const [saving, setSaving] = useState(false)

  // Info drawer
  const [activeInfoRow, setActiveInfoRow] = useState<number | null>(null)
  const [drawerRow, setDrawerRow] = useState<ResourceRow | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view")
  const [drawerOriginalRow, setDrawerOriginalRow] =
    useState<ResourceRow | null>(null)
  const [drawerIsNew, setDrawerIsNew] = useState(false)

  // Availability drawer
  const [availabilityRowIndex, setAvailabilityRowIndex] = useState<number | null>(
    null
  )
  const [availabilityWeek, setAvailabilityWeek] = useState<string | null>(null)
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const weekendGroups = ["A", "B", "C", "WC"]

  const [filters, setFilters] = useState({
    campus: "",
    cost_center_name: "",
    status: "",
    job_name: "",
    shift_group: "",
    weekend_group: "",
  })

  // --- SCROLL / LAYOUT REFS ---

  // Scrollbar #1: Availability header scrollbar (52 weeks)
  const availabilityHeaderRef = useRef<HTMLDivElement | null>(null)

  // Table scroll container (no native scrollbar shown, we drive it from bottom)
  const tableScrollRef = useRef<HTMLDivElement | null>(null)

  // Scrollbar #2: bottom scrollbar for entire table (Info → Availability)
  const tableBottomRef = useRef<HTMLDivElement | null>(null)

  // Width of the scrollable table content (for bottom bar)
  const [tableScrollWidth, setTableScrollWidth] = useState(0)

  // Compute width: 52 weeks * WEEK_WIDTH
  const totalWeeksWidth = TOTAL_WEEKS_WIDTH

  // ------------------------------
  // COLUMN WIDTH / RESIZE SYSTEM
  // ------------------------------
  const [colWidth, setColWidth] = useState({
    info: 70,
    cost_center_name: 150,
    employee_id: 130,
    full_name: 200,
    job_name: 160,
    unit_fte: 90,
    shift_group: 150,
    weekend_group: 120,
    availability: 260,
  })

  const startResizing = (
    e: ReactMouseEvent<HTMLDivElement>,
    key: keyof typeof colWidth
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startWidth = colWidth[key]

    const handleMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.max(60, startWidth + (ev.clientX - startX))
      setColWidth((prev) => ({ ...prev, [key]: newWidth }))
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // ------------------------------
  // COLUMN VISIBILITY
  // ------------------------------
  const [colVisible, setColVisible] = useState({
    info: true,
    cost_center_name: true,
    employee_id: true,
    full_name: true,
    job_name: true,
    unit_fte: true,
    shift_group: true,
    weekend_group: true,
    availability: true,
  })

  const toggleColumn = (key: keyof typeof colVisible) => {
    setColVisible((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const COLUMN_CONFIG: { key: keyof typeof colVisible; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "cost_center_name", label: "Cost Center" },
    { key: "employee_id", label: "Employee ID" },
    { key: "full_name", label: "Full Name" },
    { key: "job_name", label: "Job Name" },
    { key: "unit_fte", label: "Unit FTE" },
    { key: "shift_group", label: "Shift Group" },
    { key: "weekend_group", label: "Weekend Group" },
    { key: "availability", label: "Availability" },
  ]

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false)

  // ------------------------------
  // DEBOUNCED AUTOSAVE
  // ------------------------------
  const debouncedSave = useCallback(
    debounce((updated: ResourceRow[]) => {
      setSaving(true)
      updateData("resourceInput", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // ------------------------------
  // INITIALIZE DATA
  // ------------------------------
  useEffect(() => {
    const resourceArray = Array.isArray(data?.resourceInput)
      ? (data.resourceInput as ResourceRow[])
      : []

    const mockEmployees: ResourceRow[] = [
      {
        id: 1,
        campus: "Main Campus",
        cost_center_name: "5W",
        employee_id: "EMP1001",
        first_name: "Emily",
        last_name: "Nguyen",
        position: "RN",
        job_name: "Nurse",
        unit_fte: 0.9,
        shift: "",
        shift_group: "",
        weekend_group: "A",
        start_date: "",
        end_date: "",
        vacancy_status: "Filled",
      },
      {
        id: 2,
        campus: "Main Campus",
        cost_center_name: "5W",
        employee_id: "EMP1002",
        first_name: "Carlos",
        last_name: "García",
        position: "NA/UC",
        job_name: "Nurse Assistant / Unit Clerk",
        unit_fte: 0.9,
        shift: "",
        shift_group: "",
        weekend_group: "C",
        start_date: "",
        end_date: "",
        vacancy_status: "Filled",
      },
      {
        id: 3,
        campus: "Main Campus",
        cost_center_name: "5W",
        employee_id: "EMP1003",
        first_name: "",
        last_name: "",
        position: "",
        job_name: "",
        unit_fte: 0.9,
        shift: "",
        shift_group: "",
        weekend_group: "",
        start_date: "",
        end_date: "",
        vacancy_status: "",
      },
    ]

    // keep existing + ensure the 3 mock rows exist (by employee_id)
    const existingIds = new Set(resourceArray.map((r) => r.employee_id))
    const merged = [
      ...resourceArray,
      ...mockEmployees.filter((m) => !existingIds.has(m.employee_id)),
    ]

    setRows(merged)
  }, [data?.resourceInput])

  // ------------------------------
  // TABLE WIDTH FOR BOTTOM SCROLLBAR
  // ------------------------------
  useEffect(() => {
    const fixedColsWidth =
      (colVisible.info ? colWidth.info : 0) +
      (colVisible.cost_center_name ? colWidth.cost_center_name : 0) +
      (colVisible.employee_id ? colWidth.employee_id : 0) +
      (colVisible.full_name ? colWidth.full_name : 0) +
      (colVisible.job_name ? colWidth.job_name : 0) +
      (colVisible.unit_fte ? colWidth.unit_fte : 0) +
      (colVisible.shift_group ? colWidth.shift_group : 0) +
      (colVisible.weekend_group ? colWidth.weekend_group : 0)

    const availabilityWidth = colVisible.availability ? colWidth.availability : 0
    const fullWidth = fixedColsWidth + availabilityWidth + 40 // a little padding

    const weeksWidth = totalWeeksWidth

    setTableScrollWidth(fullWidth + weeksWidth)
  }, [colWidth, colVisible, totalWeeksWidth])

  // ------------------------------
  // STAFFING CONFIG HELPERS
  // ------------------------------
  const positions: string[] = Array.from(
    new Set(
      (data?.staffingConfig || []).map((row: any) => row.resource_type || row.job)
    )
  ).filter(Boolean)

  const getFilteredShifts = (resourceType: string): string[] => {
    if (!resourceType) return []
    return (data?.staffingConfig || [])
      .filter((row: any) => row.resource_type === resourceType)
      .map((row: any) => row.shift_group_name || row.shift_group || "")
      .filter(Boolean)
  }

  const [weekendGroupList, setWeekendGroupList] = useState<string[]>(weekendGroups)

  useEffect(() => {
    if (!data?.staffingConfig) return
    const derivedWeekendGroups = Array.from(
      new Set(
        (data.staffingConfig as any[])
          .map((r) => r.weekend_group)
          .filter(Boolean)
      )
    ) as string[]
    if (derivedWeekendGroups.length > 0) {
      setWeekendGroupList(derivedWeekendGroups)
    }
  }, [data?.staffingConfig])

  // ------------------------------
  // CHANGE HANDLER
  // ------------------------------
  const handleChange = async (
    index: number,
    field: keyof ResourceRow,
    value: any
  ) => {
    const updated = [...rows]
    const prevValue = updated[index][field]
    updated[index] = { ...updated[index], [field]: value }

    // Duplicate employee guard
    if (field === "employee_id" || field === "id") {
      const duplicateIndex = updated.findIndex(
        (r, i) => i !== index && r.employee_id === value
      )
      if (duplicateIndex !== -1) {
        const existing = updated[duplicateIndex]
        const current = updated[index]
        const differs =
          existing.first_name !== current.first_name ||
          existing.last_name !== current.last_name ||
          existing.position !== current.position

        if (differs) {
          const result = await Swal.fire({
            title: "Duplicate ID Detected",
            text: "An entry with this ID already exists but has different details. Do you want to overwrite it?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, overwrite",
            cancelButtonText: "No, keep both",
          })

          if (result.isConfirmed) {
            updated[duplicateIndex] = { ...current }
            Swal.fire(
              "Overwritten",
              "Existing record updated successfully.",
              "success"
            )
          } else {
            if (typeof prevValue !== "undefined") {
              ;(updated[index] as Record<string, any>)[field] = prevValue
            }
          }
        }
      }
    }

    setRows(updated)
    debouncedSave(updated)
  }

  // ------------------------------
  // EMPLOYEE INFO DRAWER HELPERS
  // ------------------------------
  const openDrawerForRow = (
    rowIndex: number,
    mode: "view" | "edit",
    isNew = false
  ) => {
    const baseRow = rows[rowIndex]
    setActiveInfoRow(rowIndex)
    setDrawerRow({ ...baseRow })
    setDrawerOriginalRow({ ...baseRow })
    setDrawerMode(mode)
    setDrawerIsNew(isNew)
  }

  const closeDrawer = () => {
    if (drawerIsNew && activeInfoRow !== null) {
      const updated = rows.filter((_, idx) => idx !== activeInfoRow)
      setRows(updated)
      updateData("resourceInput", updated)
    }
    setActiveInfoRow(null)
    setDrawerRow(null)
    setDrawerOriginalRow(null)
    setDrawerIsNew(false)
    setDrawerMode("view")
  }

  const saveDrawer = () => {
    if (activeInfoRow === null || !drawerRow) return
    const updated = [...rows]
    updated[activeInfoRow] = { ...drawerRow }
    setRows(updated)
    debouncedSave(updated)
    setDrawerMode("view")
    setDrawerIsNew(false)
    setDrawerOriginalRow({ ...drawerRow })
  }

  const cancelDrawerEdit = () => {
    if (!drawerOriginalRow) {
      closeDrawer()
      return
    }
    if (drawerIsNew) {
      closeDrawer()
      return
    }
    setDrawerRow({ ...drawerOriginalRow })
    setDrawerMode("view")
  }

  const updateDrawerField = (field: keyof ResourceRow, value: any) => {
    setDrawerRow((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  // ------------------------------
  // AVAILABILITY DRAWER HELPERS
  // ------------------------------
  const openAvailabilityForRow = (rowIndex: number, weekStart?: string) => {
    setAvailabilityRowIndex(rowIndex)
    setAvailabilityWeek(weekStart ?? null)
    setIsAvailabilityOpen(true)
  }

  const closeAvailabilityDrawer = () => {
    setIsAvailabilityOpen(false)
    setAvailabilityRowIndex(null)
    setAvailabilityWeek(null)
  }

  const handleAvailabilitySave = (entries: AvailabilityEntry[]) => {
    if (availabilityRowIndex === null) {
      closeAvailabilityDrawer()
      return
    }

    setRows((prev) => {
      const updated = [...prev]
      const target = {
        ...updated[availabilityRowIndex],
        availability: entries,
      }
      updated[availabilityRowIndex] = target
      debouncedSave(updated)
      return updated
    })

    closeAvailabilityDrawer()
  }

  const currentAvailabilityRow =
    availabilityRowIndex !== null ? rows[availabilityRowIndex] : null

  // ------------------------------
  // ADD ROW
  // ------------------------------
  const addRow = () => {
    const newRow: ResourceRow = {
      id: Date.now(),
      campus: "",
      cost_center_name: "",
      employee_id: "",
      first_name: "",
      last_name: "",
      position: "",
      job_name: "",
      unit_fte: 1,
      shift: "",
      shift_group: "",
      weekend_group: "",
      start_date: "",
      end_date: "",
      vacancy_status: "",
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
    const newIndex = updated.length - 1
    openDrawerForRow(newIndex, "edit", true)
  }

  // ------------------------------
  // CSV UPLOAD / EXPORT
  // ------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as any[]

        const newRows: ResourceRow[] = rawData.map((row) => ({
          campus: row.Campus || "",
          cost_center_name: row["Cost Center Name"] || "",
          employee_id: row["Employee ID"] || "",
          first_name: row["First Name"] || "",
          last_name: row["Last Name"] || "",
          position: row.Position || "",
          job_name: row["Job Name"] || "",
          unit_fte: Number(row["Unit FTE"] || 1),
          shift: row.Shift || "",
          shift_group: row["Shift Group"] || "",
          weekend_group: row["Weekend Group"] || "",
          start_date: row["Start Date"] || "",
          end_date: row["End Date"] || "",
          vacancy_status: row["Vacancy Status"] || "",
          id: Date.now() + Math.random(),
        }))

        const updated = [...rows, ...newRows]
        setRows(updated)
        debouncedSave(updated)
        if (fileInputRef.current) fileInputRef.current.value = ""
      },
    })
  }

  const normalizeGroup = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return ""
    return String(value)
  }

  const handleExport = () => {
    const exportRows = rows.map((row) => ({
      Campus: row.campus,
      "Cost Center Name": row.cost_center_name,
      "Employee ID": row.employee_id,
      "First Name": row.first_name,
      "Last Name": row.last_name,
      Position: row.position,
      "Job Name": row.job_name,
      "Unit FTE": row.unit_fte,
      "Shift Group": normalizeGroup(row.shift_group || row.shift),
      "Weekend Group": normalizeGroup(row.weekend_group),
      "Start Date": row.start_date,
      "End Date": row.end_date,
      "Vacancy Status": row.vacancy_status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resource Input")
    XLSX.writeFile(workbook, "resource-input-export.xlsx")
  }

  // ------------------------------
  // FILTERING + DROPDOWNS
  // ------------------------------
  const filteredRows = rows.filter((r) => {
    const campusOk =
      !filters.campus || r.campus.toLowerCase() === filters.campus.toLowerCase()
    const ccOk =
      !filters.cost_center_name ||
      (r.cost_center_name || "")
        .toLowerCase()
        .includes(filters.cost_center_name.toLowerCase())
    const statusOk =
      !filters.status ||
      (r.vacancy_status || "").toLowerCase() === filters.status.toLowerCase()
    const jobOk =
      !filters.job_name ||
      (r.job_name || r.position || "")
        .toLowerCase()
        .includes(filters.job_name.toLowerCase())
    const shiftOk =
      !filters.shift_group ||
      normalizeGroup(r.shift_group || r.shift) === filters.shift_group
    const weekendOk =
      !filters.weekend_group ||
      normalizeGroup(r.weekend_group) === filters.weekend_group

    return campusOk && ccOk && statusOk && jobOk && shiftOk && weekendOk
  })

  const campuses = Array.from(
    new Set(rows.map((r) => r.campus).filter(Boolean))
  ) as string[]
  const costCenters = Array.from(
    new Set(rows.map((r) => r.cost_center_name).filter(Boolean))
  ) as string[]
  const statuses = Array.from(
    new Set(rows.map((r) => r.vacancy_status).filter(Boolean))
  ) as string[]
  const jobNames = Array.from(
    new Set(rows.map((r) => r.job_name || r.position).filter(Boolean))
  ) as string[]
  const shiftGroups = Array.from(
    new Set(rows.map((r) => r.shift_group || r.shift).filter(Boolean))
  ) as string[]
  const weekendOptions = Array.from(
    new Set(rows.map((r) => r.weekend_group).filter(Boolean))
  ) as string[]

  const formatFullName = (row: ResourceRow) =>
    `${row.first_name || ""} ${row.last_name || ""}`.trim() || "—"

  const headerLabel = (text: string) => (
    <span
      className="block overflow-hidden whitespace-nowrap"
      style={{ fontSize: "clamp(10px, 0.9vw, 14px)" }}
    >
      {text}
    </span>
  )

  // ------------------------------
  // HEADER AVAILABILITY SCROLLBAR
  // ------------------------------
  const handleAvailabilityHeaderScroll = (
    e: React.UIEvent<HTMLDivElement, UIEvent>
  ) => {
    const left = e.currentTarget.scrollLeft
    const nodes =
      document.querySelectorAll<HTMLDivElement>(".availability-row")
    nodes.forEach((node) => {
      node.scrollLeft = left
    })
  }

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Resource Input</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            title="Upload CSV file"
            aria-label="Upload CSV file"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload CSV
          </Button>
          <Button
            onClick={handleExport}
            variant="ghost"
            className="border border-gray-300 text-gray-700"
          >
            Export CSV
          </Button>

          <Button
            variant="ghost"
            className="border border-red-400 text-red-600 hover:bg-red-50"
            onClick={() => {
              Swal.fire({
                title: "Clear All?",
                text: "This will remove all rows permanently.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, clear all",
              }).then((result) => {
                if (result.isConfirmed) {
                  setRows([])
                  updateData("resourceInput", [])
                  Swal.fire("Cleared!", "All resources removed.", "success")
                }
              })
            }}
          >
            🗑 Clear All
          </Button>
          <Button onClick={addRow} className="bg-green-600 hover:bg-green-700">
            + Add Resource
          </Button>
        </div>
      </div>

      {/* Filters + Manage Columns */}
      <div className="flex flex-wrap gap-3 items-center mb-3">
        <Select
          value={filters.campus}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, campus: e.target.value }))
          }
        >
          <option value="">All Campuses</option>
          {campuses.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>

        <Select
          value={filters.cost_center_name}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              cost_center_name: e.target.value,
            }))
          }
        >
          <option value="">All Cost Centers</option>
          {costCenters.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>

        <Select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>

        <Select
          value={filters.job_name}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, job_name: e.target.value }))
          }
        >
          <option value="">All Job Names</option>
          {jobNames.map((j) => (
            <option key={j}>{j}</option>
          ))}
        </Select>

        <Select
          value={filters.shift_group}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, shift_group: e.target.value }))
          }
        >
          <option value="">All Shift Groups</option>
          {shiftGroups.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>

        <Select
          value={filters.weekend_group}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, weekend_group: e.target.value }))
          }
        >
          <option value="">All Weekend Groups</option>
          {weekendOptions.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>

        <Button
          variant="ghost"
          onClick={() =>
            setFilters({
              campus: "",
              cost_center_name: "",
              status: "",
              job_name: "",
              shift_group: "",
              weekend_group: "",
            })
          }
        >
          Clear Filters
        </Button>

        {/* Manage Columns */}
        <div className="ml-auto relative">
          <Button
            variant="ghost"
            onClick={() => setIsColumnMenuOpen((open) => !open)}
          >
            Manage Columns
          </Button>

          {isColumnMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsColumnMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-56 bg-white border rounded-lg shadow-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500">
                  Toggle columns
                </p>
                {COLUMN_CONFIG.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={colVisible[col.key]}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* TABLE + SCROLLBARS */}
      {rows.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-white">
          {/* Header row with Availability header scrollbar */}
          <div
            ref={tableScrollRef}
            className="overflow-x-hidden"
            style={{ position: "relative" }}
          >
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {/* Info */}
                  {colVisible.info && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.info }}
                    >
                      {headerLabel("«")}
                      <div
                        onMouseDown={(e) => startResizing(e, "info")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Cost Center */}
                  {colVisible.cost_center_name && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.cost_center_name }}
                    >
                      {headerLabel("Cost Center")}
                      <div
                        onMouseDown={(e) => startResizing(e, "cost_center_name")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Employee ID */}
                  {colVisible.employee_id && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.employee_id }}
                    >
                      {headerLabel("Employee ID")}
                      <div
                        onMouseDown={(e) => startResizing(e, "employee_id")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Full Name */}
                  {colVisible.full_name && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.full_name }}
                    >
                      {headerLabel("Full Name")}
                      <div
                        onMouseDown={(e) => startResizing(e, "full_name")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Job Name */}
                  {colVisible.job_name && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.job_name }}
                    >
                      {headerLabel("Job Name")}
                      <div
                        onMouseDown={(e) => startResizing(e, "job_name")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Unit FTE */}
                  {colVisible.unit_fte && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.unit_fte }}
                    >
                      {headerLabel("Unit FTE")}
                      <div
                        onMouseDown={(e) => startResizing(e, "unit_fte")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Shift Group */}
                  {colVisible.shift_group && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.shift_group }}
                    >
                      {headerLabel("Shift Group")}
                      <div
                        onMouseDown={(e) => startResizing(e, "shift_group")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Weekend Group */}
                  {colVisible.weekend_group && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.weekend_group }}
                    >
                      {headerLabel("Weekend")}
                      <div
                        onMouseDown={(e) => startResizing(e, "weekend_group")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}

                  {/* Availability with its own internal scrollbar */}
                  {colVisible.availability && (
                    <th
                      className="border px-2 py-2 text-center align-middle"
                      style={{ width: colWidth.availability }}
                    >
                      <div className="flex flex-col gap-1">
                        {headerLabel("Availability")}
                        <div
                          ref={availabilityHeaderRef}
                          className="relative h-4 overflow-x-auto"
                          onScroll={handleAvailabilityHeaderScroll}
                        >
                          <div
                            style={{
                              width: totalWeeksWidth,
                              height: "4px",
                            }}
                          />
                        </div>
                      </div>
                      <div
                        onMouseDown={(e) => startResizing(e, "availability")}
                        className="w-1 h-full cursor-col-resize inline-block align-middle ml-1"
                      />
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, rowIndex) => {
                  const effectiveIndex = rows.findIndex(
                    (r) => r.id === row.id && r.employee_id === row.employee_id
                  )

                  return (
                    <ResourceRowItem
                      key={`${row.id}-${row.employee_id}-${rowIndex}`}
                      row={row}
                      rowIndex={rowIndex}
                      effectiveIndex={effectiveIndex}
                      colVisible={colVisible}
                      colWidth={colWidth}
                      weekendGroupList={weekendGroupList}
                      jobNames={jobNames}
                      positions={positions}
                      formatFullName={formatFullName}
                      // pass the filtered shifts array for this row's position
                      filteredShifts={getFilteredShifts(row.position || "")}
                      startResizing={startResizing}
                      handleChange={handleChange}
                      openDrawerForRow={openDrawerForRow}
                      openAvailabilityForRow={openAvailabilityForRow}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* SCROLLBAR #2: bottom bar controlling entire table horizontally */}
          <div
            ref={tableBottomRef}
            className="h-4 overflow-x-auto bg-gray-50"
            onScroll={(e) => {
              if (!tableScrollRef.current) return
              tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
            }}
          >
            <div style={{ width: tableScrollWidth || "100%" }} />
          </div>
        </div>
      )}

      {/* Employee Information Drawer (LEFT) */}
      {activeInfoRow !== null && drawerRow && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-40"
            onClick={closeDrawer}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <Button
                variant="ghost"
                className="text-red-600 text-xl"
                onClick={() => {
                  Swal.fire({
                    title: "Delete Employee?",
                    text: "This will permanently remove this employee.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Delete",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      const updated = rows.filter(
                        (r) =>
                          r.id !== drawerRow.id &&
                          r.employee_id !== drawerRow.employee_id
                      )
                      setRows(updated)
                      updateData("resourceInput", updated)
                      closeDrawer()
                      Swal.fire("Deleted!", "Employee removed.", "success")
                    }
                  })
                }}
              >
                🗑
              </Button>

              <h3 className="text-lg font-semibold text-gray-800">
                Employee Information
              </h3>

              <Button
                variant="ghost"
                className="text-gray-600 text-xl"
                onClick={closeDrawer}
              >
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 text-sm text-gray-700">
              {/* Main table fields mirrored */}
              <div>
                <p className="font-semibold">Cost Center Name</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`drawer_cost_center_${drawerRow.id || "new"}`}
                    value={drawerRow.cost_center_name || ""}
                    onChange={(e) =>
                      updateDrawerField("cost_center_name", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.cost_center_name || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Employee ID</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`drawer_employee_id_${drawerRow.id || "new"}`}
                    value={drawerRow.employee_id || ""}
                    onChange={(e) =>
                      updateDrawerField("employee_id", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.employee_id || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Full Name</p>
                {drawerMode === "edit" ? (
                  <div className="flex gap-2">
                    <Input
                      id={`drawer_first_name_${drawerRow.id || "new"}`}
                      placeholder="First name"
                      value={drawerRow.first_name}
                      onChange={(e) =>
                        updateDrawerField("first_name", e.target.value)
                      }
                    />
                    <Input
                      id={`drawer_last_name_${drawerRow.id || "new"}`}
                      placeholder="Last name"
                      value={drawerRow.last_name}
                      onChange={(e) =>
                        updateDrawerField("last_name", e.target.value)
                      }
                    />
                  </div>
                ) : (
                  <p>{formatFullName(drawerRow)}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Job Name</p>
                {drawerMode === "edit" ? (
                  <Select
                    value={drawerRow.job_name || drawerRow.position}
                    onChange={(e) =>
                      updateDrawerField("job_name", e.target.value)
                    }
                  >
                    <option value="">-- Select --</option>
                    {jobNames.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p>{drawerRow.job_name || drawerRow.position || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Unit FTE</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`drawer_unit_fte_${drawerRow.id || "new"}`}
                    type="number"
                    min={0}
                    step={0.1}
                    value={drawerRow.unit_fte}
                    onChange={(e) =>
                      updateDrawerField("unit_fte", Number(e.target.value))
                    }
                  />
                ) : (
                  <p>{drawerRow.unit_fte}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Shift Group</p>
                {drawerMode === "edit" ? (
                  <Select
                    value={drawerRow.shift_group || drawerRow.shift}
                    onChange={(e) =>
                      updateDrawerField("shift_group", e.target.value)
                    }
                  >
                    <option value="">-- Select --</option>
                    {getFilteredShifts(drawerRow.position || "").map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p>{drawerRow.shift_group || drawerRow.shift || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Weekend Group</p>
                {drawerMode === "edit" ? (
                  <Select
                    value={drawerRow.weekend_group}
                    onChange={(e) =>
                      updateDrawerField("weekend_group", e.target.value)
                    }
                  >
                    <option value="">-- Select --</option>
                    {weekendGroupList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p>{drawerRow.weekend_group || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Start Date</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`drawer_start_date_${drawerRow.id || "new"}`}
                    type="date"
                    value={drawerRow.start_date || ""}
                    onChange={(e) =>
                      updateDrawerField("start_date", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.start_date || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">End Date</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`drawer_end_date_${drawerRow.id || "new"}`}
                    type="date"
                    value={drawerRow.end_date || ""}
                    onChange={(e) =>
                      updateDrawerField("end_date", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.end_date || "—"}</p>
                )}
              </div>

              {/* Extra profile fields */}
              <div>
                <p className="font-semibold">Schedule System ID</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`schedule_system_id_${drawerRow.id || "new"}`}
                    value={drawerRow.schedule_system_id || ""}
                    onChange={(e) =>
                      updateDrawerField("schedule_system_id", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.schedule_system_id || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">EHR ID</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`ehr_id_${drawerRow.id || "new"}`}
                    value={drawerRow.ehr_id || ""}
                    onChange={(e) =>
                      updateDrawerField("ehr_id", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.ehr_id || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Primary Cost Center ID</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`primary_cost_center_id_${drawerRow.id || "new"}`}
                    value={drawerRow.primary_cost_center_id || ""}
                    onChange={(e) =>
                      updateDrawerField(
                        "primary_cost_center_id",
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <p>{drawerRow.primary_cost_center_id || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Primary Job Category ID</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`primary_job_category_id_${drawerRow.id || "new"}`}
                    value={drawerRow.primary_job_category_id || ""}
                    onChange={(e) =>
                      updateDrawerField(
                        "primary_job_category_id",
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <p>{drawerRow.primary_job_category_id || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Primary Job Category Name</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`primary_job_category_name_${drawerRow.id || "new"}`}
                    value={drawerRow.primary_job_category_name || ""}
                    onChange={(e) =>
                      updateDrawerField(
                        "primary_job_category_name",
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <p>{drawerRow.primary_job_category_name || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Primary Job Code ID</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`primary_job_code_id_${drawerRow.id || "new"}`}
                    value={drawerRow.primary_job_code_id || ""}
                    onChange={(e) =>
                      updateDrawerField("primary_job_code_id", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.primary_job_code_id || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Expected Hours per week</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`expected_hours_per_week_${drawerRow.id || "new"}`}
                    type="number"
                    value={
                      drawerRow.expected_hours_per_week !== undefined &&
                      drawerRow.expected_hours_per_week !== null
                        ? drawerRow.expected_hours_per_week
                        : ""
                    }
                    onChange={(e) =>
                      updateDrawerField(
                        "expected_hours_per_week",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                  />
                ) : (
                  <p>
                    {drawerRow.expected_hours_per_week !== undefined &&
                    drawerRow.expected_hours_per_week !== null
                      ? drawerRow.expected_hours_per_week
                      : "—"}
                  </p>
                )}
              </div>

              <div>
                <p className="font-semibold">Status</p>
                {drawerMode === "edit" ? (
                  <Select
                    value={drawerRow.vacancy_status}
                    onChange={(e) =>
                      updateDrawerField("vacancy_status", e.target.value)
                    }
                  >
                    <option value="">-- Select --</option>
                    <option value="Filled">Filled</option>
                    <option value="Posted">Posted</option>
                  </Select>
                ) : (
                  <p>{drawerRow.vacancy_status || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Term Date</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`term_date_${drawerRow.id || "new"}`}
                    type="date"
                    value={drawerRow.term_date || ""}
                    onChange={(e) =>
                      updateDrawerField("term_date", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.term_date || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Seniority Date</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`seniority_date_${drawerRow.id || "new"}`}
                    type="date"
                    value={drawerRow.seniority_date || ""}
                    onChange={(e) =>
                      updateDrawerField("seniority_date", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.seniority_date || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Seniority Value</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`seniority_value_${drawerRow.id || "new"}`}
                    value={drawerRow.seniority_value || ""}
                    onChange={(e) =>
                      updateDrawerField("seniority_value", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.seniority_value || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Report To ID</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`report_to_id_${drawerRow.id || "new"}`}
                    value={drawerRow.report_to_id || ""}
                    onChange={(e) =>
                      updateDrawerField("report_to_id", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.report_to_id || "—"}</p>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-between">
              {drawerMode === "view" ? (
                <>
                  <Button onClick={() => setDrawerMode("edit")}>Edit</Button>
                  <Button variant="ghost" onClick={closeDrawer}>
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={saveDrawer}>Save</Button>
                  <Button variant="ghost" onClick={cancelDrawerEdit}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Availability Drawer (RIGHT) */}
      {isAvailabilityOpen && currentAvailabilityRow && (
        <AvailabilityDrawer
          row={currentAvailabilityRow}
          initialWeek={availabilityWeek}
          onClose={closeAvailabilityDrawer}
          onSave={handleAvailabilitySave}
        />
      )}
    </Card>
  )
}
