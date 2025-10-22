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

  // 🔁 Randomized one-to-one Cost Center ↔ Department map
  const costCenterMap: Record<string, string> = {
    "1001": "ICU",
    "1002": "Med-Surg",
    "1003": "ER",
    "1004": "Telemetry",
    "1005": "Labor & Delivery",
    "1006": "Rehab",
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

  const [lockedField, setLockedField] = useState<"department" | "costCenter" | null>(null)

  // 🔁 Auto-sync FacilitySetup with AppContext
  useEffect(() => {
    updateFacilitySetup({
      facility: form.facility,
      department: form.department,
      costCenter: form.costCenter,
      bedCount: Number(form.bedCount) || 0,
      categories: ["Nursing", "Support", "Other"],
    })
  }, [form])

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      let updated = { ...prev, [key]: value }

      // 🔒 Auto-link Cost Center ↔ Department
      if (key === "department" && !lockedField) {
        const match = Object.entries(costCenterMap).find(([cc, dept]) => dept === value)
        if (match) {
          updated.costCenter = match[0]
          setLockedField("department")
        }
      }
      if (key === "costCenter" && !lockedField) {
        const dept = costCenterMap[value]
        if (dept) {
          updated.department = dept
          setLockedField("costCenter")
        }
      }

      return updated
    })
  }

  const handleContinue = () => {
    updateFacilitySetup({
      facility: form.facility,
      department: form.department,
      costCenter: form.costCenter,
      bedCount: Number(form.bedCount) || 0,
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
          disabled={lockedField === "costCenter"}
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
          disabled={lockedField === "department"}
          onChange={(e) => handleChange("costCenter", e.target.value)}
        >
          <option value="">-- Select Cost Center --</option>
          {costCenters.map((cc) => (
            <option key={cc} value={cc}>
              {cc} — {costCenterMap[cc]}
            </option>
          ))}
        </Select>

        {/* Bed Count */}
        <Input
          id="bedCount"
          label="Bed Count"
          type="number"
          min={0}
          value={form.bedCount}
          onChange={(e) => handleChange("bedCount", e.target.value)}
          placeholder="Enter bed count"
        />
      </div>

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
