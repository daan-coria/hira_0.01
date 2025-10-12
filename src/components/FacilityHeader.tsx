import { useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import { useApp } from "@/store/AppContext"

type Props = {
  onNext?: () => void
  onSetupComplete?: () => void
}

export default function FacilityHeader({ onNext, onSetupComplete }: Props) {
  const { updateFacilitySetup } = useApp()

  const [form, setForm] = useState({
    facility: "",
    department: "",
    costCenter: "",
    bedCount: "",
    startDate: "",
    endDate: "",
  })

  // Dropdown option sets
  const facilityOptions = [
    "General Hospital",
    "Regional Medical Center",
    "Valley Care Center",
  ]

  const costCenterOptions = ["CC1001", "CC2003", "CC3012", "CC4015"]

  // ✅ Facility → Department dynamic mapping
  const departmentMap: Record<string, string[]> = {
    "General Hospital": ["ICU", "ER", "Med-Surg", "Pediatrics"],
    "Regional Medical Center": [
      "ICU",
      "Telemetry",
      "Oncology",
      "Labor & Delivery",
    ],
    "Valley Care Center": ["Rehab", "Memory Care", "Skilled Nursing"],
  }

  // Derived departments based on selected facility
  const departmentOptions =
    departmentMap[form.facility] || ["(Select facility first)"]

  const handleChange = (key: keyof typeof form, value: string) => {
    // Reset department if facility changes
    if (key === "facility") {
      setForm((prev) => ({ ...prev, facility: value, department: "" }))
    } else {
      setForm((prev) => ({ ...prev, [key]: value }))
    }
  }

  const handleContinue = () => {
    const payload = {
      facility: form.facility,
      department: form.department,
      costCenter: form.costCenter,
      bedCount: Number(form.bedCount) || 0,
      dateRange: {
        start: form.startDate,
        end: form.endDate,
      },
    }

    updateFacilitySetup(payload)

    // ✅ Trigger navigation callback(s)
    if (onNext) onNext()
    if (onSetupComplete) onSetupComplete()
  }

  return (
    <Card title="HIRA Staffing Tool">
      <div className="grid grid-cols-3 gap-4">
        {/* Facility */}
        <Select
          id="facility"
          label="Facility"
          value={form.facility}
          onChange={(e) => handleChange("facility", e.target.value)}
        >
          <option value="">-- Select Facility --</option>
          {facilityOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>

        {/* Department */}
        <Select
          id="department"
          label="Department"
          value={form.department}
          onChange={(e) => handleChange("department", e.target.value)}
          disabled={!form.facility}
        >
          <option value="">-- Select Department --</option>
          {departmentOptions.map((opt) => (
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
        >
          <option value="">-- Select Cost Center --</option>
          {costCenterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>

        {/* Bed Count (Numeric input + suggestions) */}
        <div className="flex flex-col">
          <label
            htmlFor="bedCount"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Bed Count
          </label>
          <Input
            id="bedCount"
            label=""
            type="number"
            min={0}
            value={form.bedCount}
            onChange={(e) => handleChange("bedCount", e.target.value)}
            list="bedCounts"
            className="!m-0 !p-1"
          />
          <datalist id="bedCounts">
            {[0, 10, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500].map(
              (v) => (
                <option key={v} value={v} />
              )
            )}
          </datalist>
        </div>

        {/* Start Date */}
        <Input
          id="startDate"
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
        />

        {/* End Date */}
        <Input
          id="endDate"
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={(e) => handleChange("endDate", e.target.value)}
        />
      </div>

      {/* Continue button */}
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={
            !form.facility ||
            !form.department ||
            !form.costCenter ||
            !form.startDate ||
            !form.endDate
          }
        >
          Continue →
        </Button>
      </div>
    </Card>
  )
}
