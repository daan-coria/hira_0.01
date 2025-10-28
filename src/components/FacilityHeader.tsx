import { useState, useEffect } from "react"
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

  // Cost Center ↔ Department mapping
  const costCenterMap: Record<string, string> = {
    "1001": "ICU",
    "1002": "Med-Surg",
    "1003": "ER",
    "1004": "Telemetry",
    "1005": "Labor & Delivery",
    "1006": "Rehab",
    "2001": "Cafeteria",
    "2002": "Maintenance",
    "2003": "Finance",
    "2004": "Administration",
  }

  const facilities = [
    "General Hospital",
    "Regional Medical Center",
    "Valley Care Center",
  ]

  const costCenters = Object.keys(costCenterMap)
  const departments = Object.values(costCenterMap)

  const [form, setForm] = useState({
    facility: "",
    department: "",
    costCenter: "",
    bedCount: "",
  })

  const [warning, setWarning] = useState<string | null>(null)
  const [isNursingUnit, setIsNursingUnit] = useState<boolean>(false)

  // Detect if the department is nursing-related
  useEffect(() => {
    const pattern = /(nurse|nursing|icu|med|surg|er|ed|tele|rehab|labor|delivery|inpatient)/i
    setIsNursingUnit(pattern.test(form.department))
  }, [form.department])

  // Auto-sync with AppContext
  useEffect(() => {
    updateFacilitySetup({
      facility: form.facility,
      department: form.department,
      costCenter: form.costCenter,
      bedCount: isNursingUnit ? Number(form.bedCount) || 0 : 0,
      categories: ["Nursing", "Support", "Other"],
    })
  }, [form, isNursingUnit])

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      let updated = { ...prev, [key]: value }
      setWarning(null)

      // Sync Department ↔ Cost Center
      if (key === "department") {
        const match = Object.entries(costCenterMap).find(
          ([cc, dept]) => dept === value
        )
        updated.costCenter = match ? match[0] : ""
        if (!match) setWarning(`No matching Cost Center found for ${value}`)
      } else if (key === "costCenter") {
        const dept = costCenterMap[value]
        updated.department = dept || ""
        if (!dept) setWarning(`No matching Department found for ${value}`)
      }

      return updated
    })
  }

  const handleContinue = () => {
    updateFacilitySetup({
      facility: form.facility,
      department: form.department,
      costCenter: form.costCenter,
      bedCount: isNursingUnit ? Number(form.bedCount) || 0 : 0,
      categories: ["Nursing", "Support", "Other"],
    })

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
          {facilities.map((opt) => (
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
        >
          <option value="">-- Select Department --</option>
          {departments.map((opt) => (
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
          {costCenters.map((cc) => (
            <option key={cc} value={cc}>
              {cc} — {costCenterMap[cc]}
            </option>
          ))}
        </Select>

        {/* Bed Count (conditional) */}
        {isNursingUnit ? (
          <Input
            id="bedCount"
            label="Bed Count"
            type="number"
            min={0}
            value={form.bedCount}
            onChange={(e) => handleChange("bedCount", e.target.value)}
            placeholder="Enter bed count"
          />
        ) : (
          <div className="col-span-1 flex flex-col justify-end">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Bed Count
            </label>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-400"
              disabled
              placeholder="N/A - not applicable"
            />
          </div>
        )}
      </div>

      {/* ⚠️ Warning message */}
      {warning && (
        <p className="text-yellow-700 bg-yellow-50 px-3 py-2 rounded mt-3 text-sm">
          ⚠️ {warning}
        </p>
      )}

      {/* Continue button */}
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!form.facility || !form.department || !form.costCenter}
        >
          Continue →
        </Button>
      </div>
    </Card>
  )
}
