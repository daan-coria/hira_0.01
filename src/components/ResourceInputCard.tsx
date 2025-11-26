import { useState, useEffect, useCallback, useRef } from "react"
import { useApp } from "@/store/AppContext"
import * as XLSX from "xlsx"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"
import Papa from "papaparse"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"
import WeeklyFTEBar from "@/components/WeeklyFTEBar"
import AvailabilityDrawer from "@/components/AvailabilityDrawer"
import { AvailabilityEntry } from "@/utils/useAvailabilityCalculator"

type ResourceRow = {
  // Core identifiers
  id?: number
  employee_id?: string

  // Name & role
  first_name: string
  last_name: string
  position: string // underlying role
  job_name?: string // displayed as "Job Name"

  // Main table fields
  campus?: string
  cost_center_name?: string
  unit_fte: number
  shift: string
  shift_group?: string
  weekend_group: "A" | "B" | "C" | "WC" | ""
  start_date?: string // main table "Start Date"
  end_date?: string // main table "End Date"

  // Status
  vacancy_status: string // used as "Status" filter

  // Availability
  availability?: AvailabilityEntry[]

  // Drawer-only extended profile
  schedule_system_id?: string
  ehr_id?: string
  primary_cost_center_id?: string
  primary_job_category_id?: string
  primary_job_category_name?: string
  primary_job_code_id?: string
  expected_hours_per_week?: number | null
  term_date?: string
  seniority_date?: string
  seniority_value?: string
  report_to_id?: string
  report_to_name?: string
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ResourceInputCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()

  const [rows, setRows] = useState<ResourceRow[]>([])
  const [saving, setSaving] = useState(false)

  // Info drawer state
  const [activeInfoRow, setActiveInfoRow] = useState<number | null>(null)
  const [drawerRow, setDrawerRow] = useState<ResourceRow | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view")
  const [drawerOriginalRow, setDrawerOriginalRow] = useState<ResourceRow | null>(null)
  const [drawerIsNew, setDrawerIsNew] = useState(false)

  // Availability drawer state (right side)
  const [availabilityRowIndex, setAvailabilityRowIndex] = useState<
    number | null
  >(null)
  const [availabilityWeek, setAvailabilityWeek] = useState<string | null>(null)
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const weekendGroups = ["A", "B", "C", "WC"]

  // Filters (per mockup bullets)
  const [filters, setFilters] = useState({
    campus: "",
    cost_center_name: "",
    status: "",
    job_name: "",
    shift_group: "",
    weekend_group: "",
  })

  // Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: ResourceRow[]) => {
      setSaving(true)
      updateData("resourceInput", updated)
      setTimeout(() => setSaving(false), 600)
    }, 500),
    [updateData]
  )

  // Initialize from stored data + mock employees
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
        shift: "Day",
        shift_group: "Day",
        weekend_group: "A",
        start_date: "",
        end_date: "",
        vacancy_status: "Filled",
        schedule_system_id: "",
        ehr_id: "",
      },
      {
        id: 2,
        campus: "Main Campus",
        cost_center_name: "5W",
        employee_id: "EMP1002",
        first_name: "Michael",
        last_name: "Lopez",
        position: "CNA",
        job_name: "NA/UC",
        unit_fte: 0.9,
        shift: "Day",
        shift_group: "Day",
        weekend_group: "C",
        start_date: "",
        end_date: "",
        vacancy_status: "Filled",
        schedule_system_id: "",
        ehr_id: "",
      },
    ]

    const merged = [
      ...mockEmployees.filter(
        (mock) => !resourceArray.some((e) => e.employee_id === mock.employee_id)
      ),
      ...resourceArray,
    ]

    setRows(merged)
    updateData("resourceInput", merged)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Positions
  const positions =
    Array.isArray(data?.staffingConfig) && data.staffingConfig.length > 0
      ? data.staffingConfig.map((p: any) => p.role)
      : ["RN", "LPN", "CNA", "Clerk"]

  // Filter shifts by role
  const getFilteredShifts = (position: string) => {
    if (!Array.isArray(data?.shiftConfig)) return []
    return (data.shiftConfig || [])
      .filter((shift: any) => shift.roles?.includes(position))
      .map((shift: any) => shift.shift_label)
  }

  // Weekend group list
  const [weekendGroupList, setWeekendGroupList] = useState<string[]>(weekendGroups)
  useEffect(() => {
    if (Array.isArray(data?.staffingConfig)) {
      const groups = Array.from(
        new Set(
          (data.staffingConfig || [])
            .map((r: any) => r.weekend_rotation)
            .filter((g: string) => g && weekendGroups.includes(g))
        )
      )
      if (groups.length > 0) setWeekendGroupList(groups)
    }
  }, [data?.staffingConfig])

  // Generic table cell change handler
  const handleChange = async (index: number, field: keyof ResourceRow, value: any) => {
    const updated = [...rows]
    const prevValue = updated[index][field]
    updated[index] = { ...updated[index], [field]: value }

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
            Swal.fire("Overwritten", "Existing record updated successfully.", "success")
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

  // --- Drawer helpers --------------------------------------------------------

  const openDrawerForRow = (rowIndex: number, mode: "view" | "edit", isNew = false) => {
    const baseRow = rows[rowIndex]
    setActiveInfoRow(rowIndex)
    setDrawerRow({ ...baseRow })
    setDrawerOriginalRow({ ...baseRow })
    setDrawerMode(mode)
    setDrawerIsNew(isNew)
  }

  const closeDrawer = () => {
    // If this was a brand-new row and user never saved → remove it
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

    // For a new row: cancel closes and removes row
    if (drawerIsNew) {
      closeDrawer()
      return
    }

    // For existing row: revert changes
    setDrawerRow({ ...drawerOriginalRow })
    setDrawerMode("view")
  }

  const updateDrawerField = (field: keyof ResourceRow, value: any) => {
    setDrawerRow((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  // --- Availability drawer helpers -------------------------------------

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
      const target = { ...updated[availabilityRowIndex], availability: entries }
      updated[availabilityRowIndex] = target
      debouncedSave(updated)
      return updated
    })

    closeAvailabilityDrawer()
  }

  const currentAvailabilityRow =
    availabilityRowIndex !== null ? rows[availabilityRowIndex] : null

  // --- Add / Remove rows -----------------------------------------------------

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

  // --- CSV Upload / Export ---------------------------------------------------

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
          cost_center_name: row.Cost_Center_Name || "",
          employee_id: row.ID || row.employee_id || "",
          first_name: row.First_Name || row.first_name || "",
          last_name: row.Last_Name || row.last_name || "",
          position: row.Position || row.position || "",
          job_name: row.Job_Name || row.job_name || row.Position || "",
          unit_fte: Number(row.Unit_FTE || row.unit_fte || 0),
          shift: row.Shift || row.shift || "",
          shift_group: row.Shift_Group || row.shift_group || row.Shift || "",
          weekend_group: normalizeGroup(row.Weekend_Group || row.weekend_group),
          start_date: row.Start_Date || "",
          end_date: row.End_Date || "",
          vacancy_status: row.Vacancy_Status || row.vacancy_status || "",
        }))

        let merged = [...rows]

        for (const newRow of newRows) {
          if (
            !newRow.employee_id &&
            !newRow.first_name &&
            !newRow.last_name &&
            !newRow.position
          )
            continue

          const matchIndex = merged.findIndex(
            (r) => r.employee_id === newRow.employee_id
          )

          if (matchIndex >= 0) {
            const existing = merged[matchIndex]
            const differs =
              existing.first_name !== newRow.first_name ||
              existing.last_name !== newRow.last_name ||
              existing.position !== newRow.position ||
              existing.unit_fte !== newRow.unit_fte ||
              existing.shift !== newRow.shift ||
              existing.weekend_group !== newRow.weekend_group ||
              existing.vacancy_status !== newRow.vacancy_status

            if (differs) {
              const result = await Swal.fire({
                title: "Duplicate ID in CSV",
                text: `Employee ID ${newRow.employee_id} already exists but has different details. Overwrite existing entry?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, overwrite",
                cancelButtonText: "No, skip",
              })

              if (result.isConfirmed) {
                merged[matchIndex] = { ...existing, ...newRow }
              }
            }
          } else {
            merged.push({ ...newRow, id: Date.now() })
          }
        }

        setRows(merged)
        updateData("resourceInput", merged)
        Swal.fire("Upload Complete", "Roster processed successfully!", "success")
        if (fileInputRef.current) fileInputRef.current.value = ""
      },
    })
  }

  const normalizeGroup = (val: any): "A" | "B" | "C" | "WC" | "" => {
    if (!val) return ""
    const t = val.toString().toUpperCase()
    if (["A", "B", "C", "WC"].includes(t)) return t as any
    if (t.includes("1")) return "A"
    if (t.includes("2")) return "B"
    if (t.includes("3")) return "C"
    if (t.includes("W")) return "WC"
    return ""
  }

  const handleExport = () => {
    if (rows.length === 0) {
      Swal.fire("No Data", "There are no rows to export.", "info")
      return
    }
    const csv = Papa.unparse(
      rows.map(({ id, ...r }) => ({
        Campus: r.campus || "",
        Cost_Center_Name: r.cost_center_name || "",
        ID: r.employee_id || "",
        First_Name: r.first_name,
        Last_Name: r.last_name,
        Position: r.position,
        Job_Name: r.job_name || "",
        Unit_FTE: r.unit_fte,
        Shift: r.shift,
        Shift_Group: r.shift_group || "",
        Weekend_Group: r.weekend_group,
        Start_Date: r.start_date || "",
        End_Date: r.end_date || "",
        Vacancy_Status: r.vacancy_status,
      }))
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = "resource_roster.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  // --- Filtering -------------------------------------------------------------

  const filteredRows = rows.filter((r) => {
    return (
      (!filters.campus || r.campus === filters.campus) &&
      (!filters.cost_center_name || r.cost_center_name === filters.cost_center_name) &&
      (!filters.status || r.vacancy_status === filters.status) &&
      (!filters.job_name || (r.job_name || r.position) === filters.job_name) &&
      (!filters.shift_group || (r.shift_group || r.shift) === filters.shift_group) &&
      (!filters.weekend_group || r.weekend_group === filters.weekend_group)
    )
  })

  // Helpers for options
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

  // Hide columns if availability exists
  const shouldHideCols = (row: ResourceRow) =>
    row.availability && row.availability.length > 0;


  // --- Render ----------------------------------------------------------------

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

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-3">
        <Select
          value={filters.campus}
          onChange={(e) => setFilters({ ...filters, campus: e.target.value })}
        >
          <option value="">All Campuses</option>
          {campuses.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>

        <Select
          value={filters.cost_center_name}
          onChange={(e) =>
            setFilters({ ...filters, cost_center_name: e.target.value })
          }
        >
          <option value="">All Cost Centers</option>
          {costCenters.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>

        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>

        <Select
          value={filters.job_name}
          onChange={(e) => setFilters({ ...filters, job_name: e.target.value })}
        >
          <option value="">All Job Names</option>
          {jobNames.map((j) => (
            <option key={j}>{j}</option>
          ))}
        </Select>

        <Select
          value={filters.shift_group}
          onChange={(e) =>
            setFilters({ ...filters, shift_group: e.target.value })
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
            setFilters({ ...filters, weekend_group: e.target.value })
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
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <p className="text-gray-500">No resource data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-center w-20">Info</th>
                <th className="px-3 py-2 border w-40">Cost Center</th>

                {/* Employee ID (conditionally hidden) */}
                {!shouldHideCols({ availability: [] } as any) && (
                  <th className="px-3 py-2 border w-28">Employee ID</th>
                )}

                <th className="px-3 py-2 border w-40">Full Name</th>
                <th className="px-3 py-2 border w-36">Job Name</th>
                <th className="px-3 py-2 border w-24 text-right">Unit FTE</th>

                {/* Shift Group (conditionally hidden) */}
                {!shouldHideCols({ availability: [] } as any) && (
                  <th className="px-3 py-2 border w-36">Shift Group</th>
                )}

                {/* Weekend Group (conditionally hidden) */}
                {!shouldHideCols({ availability: [] } as any) && (
                  <th className="px-3 py-2 border w-32">Weekend</th>
                )}

                <th className="px-3 py-2 border w-64">Availability</th>
              </tr>
            </thead>


            <tbody>
              {filteredRows.map((row, i) => {
                const rowIndex = rows.findIndex((r) => r.id === row.id)
                const effectiveIndex = rowIndex >= 0 ? rowIndex : i
                const filteredShifts = getFilteredShifts(row.position || "")

                return (
                  <tr
                    key={row.id || i}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                  >
                    {/* Information icon (≪) */}
                    <td className="border px-2 py-1 text-center">
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xl font-bold text-gray-700"
                        onClick={() =>
                          openDrawerForRow(
                            rowIndex >= 0 ? rowIndex : i,
                            "view",
                            false
                          )
                        }
                      >
                        ««
                      </Button>
                    </td>

                    {/* Cost Center Name */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`cost_center_${row.id ?? i}`}
                        value={row.cost_center_name || ""}
                        onChange={(e) =>
                          handleChange(
                            rowIndex >= 0 ? rowIndex : i,
                            "cost_center_name",
                            e.target.value
                          )
                        }
                        placeholder="Cost Center"
                        className="!m-0 !p-1"
                      />
                    </td>

                    {/* Employee ID */}
                    {!shouldHideCols(row) && (
                      <td className="border px-2 py-1">
                        <Input
                          id={`employee_id_${row.id || i}`}
                          value={row.employee_id || ""}
                          onChange={(e) =>
                            handleChange(effectiveIndex, "employee_id", e.target.value)
                          }
                          placeholder="ID"
                          className="!m-0 !p-1 w-28"
                        />
                      </td>
                    )}

                    {/* Full Name (read-only, from first/last) */}
                    <td className="border px-2 py-1">
                      <div className="px-2 py-1 bg-white rounded border border-gray-200 text-gray-800 text-sm">
                        {formatFullName(row)}
                      </div>
                    </td>

                    {/* Job Name */}
                    <td className="border px-2 py-1">
                      <Select
                        value={row.job_name || row.position}
                        onChange={(e) =>
                          handleChange(
                            rowIndex >= 0 ? rowIndex : i,
                            "job_name",
                            e.target.value
                          )
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select --</option>
                        {jobNames.concat(
                          positions.filter(
                            (p) => !jobNames.includes(p) && p !== (row.job_name || "")
                          )
                        ).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </td>

                    {/* Unit FTE */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`unit_fte_${row.id || i}`}
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.unit_fte}
                        onChange={(e) =>
                          handleChange(
                            rowIndex >= 0 ? rowIndex : i,
                            "unit_fte",
                            Number(e.target.value)
                          )
                        }
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Shift Group */}
                    {!shouldHideCols(row) && (
                      <td className="border px-2 py-1">
                        <Select
                          value={row.shift_group || row.shift}
                          onChange={(e) =>
                            handleChange(effectiveIndex, "shift_group", e.target.value)
                          }
                          className="!m-0 !p-1"
                        >
                          <option value="">-- Select --</option>
                          {filteredShifts.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Select>
                      </td>
                    )}

                    {/* Weekend Group */}
                    {!shouldHideCols(row) && (
                      <td className="border px-2 py-1 text-center">
                        <Select
                          value={row.weekend_group}
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

                    {/* Availability column */}
                    <td className="border px-2 py-1 max-w-[260px] overflow-x-auto whitespace-nowrap">
                      {row.availability && row.availability.length > 0 ? (
                        <WeeklyFTEBar
                          baseFTE={row.unit_fte}
                          availability={row.availability}
                          onWeekClick={(weekStart) =>
                            openAvailabilityForRow(
                              effectiveIndex,
                              weekStart
                            )
                          }
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          className="!px-3 !py-1 text-xs"
                          onClick={() =>
                            openAvailabilityForRow(effectiveIndex)
                          }
                        >
                          Edit Availability
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Information Drawer */}
      {activeInfoRow !== null && drawerRow && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-40"
            onClick={closeDrawer}
          />

          {/* LEFT SIDE DRAWER */}
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">

            {/* HEADER */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
              {/* LEFT = trash delete button */}
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

              {/* RIGHT = close button */}
              <Button
                variant="ghost"
                className="text-gray-600 text-xl"
                onClick={closeDrawer}
              >
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 text-sm text-gray-700">

              {/* ====== MAIN TABLE FIELDS (Top of Drawer) ====== */}

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
                      onChange={(e) => updateDrawerField("first_name", e.target.value)}
                    />
                    <Input
                      id={`drawer_last_name_${drawerRow.id || "new"}`}
                      placeholder="Last name"
                      value={drawerRow.last_name}
                      onChange={(e) => updateDrawerField("last_name", e.target.value)}
                    />
                  </div>
                ) : (
                  <p>{`${drawerRow.first_name} ${drawerRow.last_name}`.trim() || "—"}</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Job Name</p>
                {drawerMode === "edit" ? (
                  <Select
                    value={drawerRow.job_name || drawerRow.position}
                    onChange={(e) => updateDrawerField("job_name", e.target.value)}
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
                    onChange={(e) => updateDrawerField("shift_group", e.target.value)}
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
                    onChange={(e) => updateDrawerField("weekend_group", e.target.value)}
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
                    onChange={(e) => updateDrawerField("start_date", e.target.value)}
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
                    onChange={(e) => updateDrawerField("end_date", e.target.value)}
                  />
                ) : (
                  <p>{drawerRow.end_date || "—"}</p>
                )}
              </div>

              {/* Schedule IDs */}
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
                    onChange={(e) => updateDrawerField("ehr_id", e.target.value)}
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
                      updateDrawerField("primary_cost_center_id", e.target.value)
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
                <p className="font-semibold">Start Date</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`start_date_${drawerRow.id || "new"}`}
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

              <div>
                <p className="font-semibold">Report To Name</p>
                {drawerMode === "edit" ? (
                  <Input
                    id={`report_to_name_${drawerRow.id || "new"}`}
                    value={drawerRow.report_to_name || ""}
                    onChange={(e) =>
                      updateDrawerField("report_to_name", e.target.value)
                    }
                  />
                ) : (
                  <p>{drawerRow.report_to_name || "—"}</p>
                )}
              </div>
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-3 border-t flex justify-between items-center">
              {drawerMode === "view" ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={closeDrawer}
                    className="text-gray-700"
                  >
                    Close
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => setDrawerMode("edit")}
                  >
                    Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={cancelDrawerEdit}
                    className="text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveDrawer}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Availability Drawer (RIGHT side) */}
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
