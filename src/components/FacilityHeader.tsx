import { useState } from "react"
import { useApp } from "@/store/AppContext"

// Reusable UI components
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Button from "@/components/ui/Button"

type FacilityHeaderProps = {
  onSetupComplete?: () => void
}

export default function FacilityHeader({ onSetupComplete }: FacilityHeaderProps) {
  const { setFacilitySetup, setToolType } = useApp()

  const [facility, setFacility] = useState("")
  const [department, setDepartment] = useState("")
  const [costCenter, setCostCenter] = useState("")
  const [bedCount, setBedCount] = useState<number>(0)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  const handleSubmit = () => {
    if (!facility || !department || !costCenter || !dateRange.start || !dateRange.end) {
      alert("Please complete all fields before continuing.")
      return
    }

    // Auto-derive tool type from department
    const toolType =
      department.toLowerCase().includes("ed") ||
      department.toLowerCase().includes("emergency")
        ? "ED"
        : "IP"

    // Save to global state
    setToolType(toolType)
    setFacilitySetup({ facility, department, costCenter, bedCount, dateRange })

    // ✅ Trigger navigation after setup
    if (onSetupComplete) onSetupComplete()
  }

  return (
    <Card className="mb-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">HIRA Staffing Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Facility */}
        <Input
          id="facility"
          label="Facility"
          type="text"
          value={facility}
          onChange={(e) => setFacility(e.target.value)}
          placeholder="Facility name"
        />

        {/* Department */}
        <Select
          id="department"
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">-- Select Department --</option>
          <option value="Emergency Department">Emergency Department</option>
          <option value="ICU">ICU</option>
          <option value="Med/Surg">Med/Surg</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Oncology">Oncology</option>
          <option value="Labor & Delivery">Labor & Delivery</option>
        </Select>

        {/* Cost Center */}
        <Input
          id="costCenter"
          label="Cost Center"
          type="text"
          value={costCenter}
          onChange={(e) => setCostCenter(e.target.value)}
          placeholder="e.g. CC1234"
        />

        {/* Bed Count */}
        <Input
          id="bedCount"
          label="Bed Count"
          type="number"
          value={bedCount}
          onChange={(e) => setBedCount(Number(e.target.value))}
          placeholder="Number of beds"
        />

        {/* Start Date */}
        <Input
          id="startDate"
          label="Start Date"
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
        />

        {/* End Date */}
        <Input
          id="endDate"
          label="End Date"
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} variant="primary">
          Refresh Data
        </Button>
      </div>
    </Card>
  )
}
