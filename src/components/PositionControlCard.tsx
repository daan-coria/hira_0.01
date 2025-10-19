import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"

type PositionControlRow = {
  id?: number
  role: string
  budgeted_fte: number
  filled_fte: number
  open_fte?: number
}

export default function PositionControlCard() {
  const { state } = useApp()
  const { facilitySetup } = state

  const [rows, setRows] = useState<PositionControlRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const baseURL =
    import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  // Debounced autosave (prevents spam on fast edits)
  const debouncedSave = useCallback(
    debounce(async (updated: PositionControlRow[]) => {
      setSaving(true)
      try {
        if (baseURL === "/mockdata") {
          setRows(updated)
        } else {
          await Promise.all(
            updated.map(async (row) => {
              const method = row.id ? "PUT" : "POST"
              const url = row.id
                ? `${baseURL}/position-control/${row.id}`
                : `${baseURL}/position-control`
              await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...row, ...facilitySetup }),
              })
            })
          )
        }
      } catch (err: any) {
        console.error("Auto-save failed:", err)
        setError(err.message || "Failed to auto-save positions")
      } finally {
        setSaving(false)
      }
    }, 600),
    [facilitySetup]
  )

  // Load data on mount
  useEffect(() => {
    if (facilitySetup) fetchPositions()
  }, [facilitySetup])

  const fetchPositions = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      let url = ""
      if (baseURL === "/mockdata") {
        url = `${baseURL}/position-control.json`
      } else {
        const query = new URLSearchParams({
          facility: facilitySetup.facility ?? "",
          department: facilitySetup.department ?? "",
          costCenter: facilitySetup.costCenter ?? "",
          bedCount:
            facilitySetup.bedCount !== undefined && facilitySetup.bedCount !== null
              ? String(facilitySetup.bedCount)
              : "",
          start: facilitySetup.dateRange?.start ?? "",
          end: facilitySetup.dateRange?.end ?? "",
        })
        url = `${baseURL}/position-control?${query.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load position control")
      const data = await res.json()
      setRows(data)
    } catch (err: any) {
      console.error("Failed to load position control", err)
      setError(err.message || "Failed to load position control")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    index: number,
    field: keyof PositionControlRow,
    value: any
  ) => {
    const updated = rows.map((r, i) =>
      i === index
        ? {
            ...r,
            [field]: value,
            open_fte:
              field === "budgeted_fte" || field === "filled_fte"
                ? (field === "budgeted_fte" ? value : r.budgeted_fte) -
                  (field === "filled_fte" ? value : r.filled_fte)
                : r.budgeted_fte - r.filled_fte,
          }
        : r
    )
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: PositionControlRow = {
      id: Date.now(),
      role: "",
      budgeted_fte: 0,
      filled_fte: 0,
      open_fte: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Position Control</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addRow}>+ Add Position</Button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded mb-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading position control...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border text-right">Budgeted FTE</th>
                <th className="px-3 py-2 border text-right">Filled FTE</th>
                <th className="px-3 py-2 border text-right">Open FTE</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No positions defined yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <td className="border px-2 py-1">
                      <Select
                        id={`role_${i}`}
                        label="Role"
                        value={row.role}
                        onChange={(e) =>
                          handleChange(i, "role", e.target.value)
                        }
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Role --</option>
                        <option value="RN">RN</option>
                        <option value="LPN">LPN</option>
                        <option value="CNA">CNA</option>
                        <option value="Clerk">Clerk</option>
                      </Select>
                    </td>

                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`budgeted_${i}`}
                        label="Budgeted FTE"
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.budgeted_fte}
                        onChange={(e) =>
                          handleChange(i, "budgeted_fte", Number(e.target.value))
                        }
                        className="!m-0 !p-1 w-24 text-right"
                      />
                    </td>

                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`filled_${i}`}
                        label="Filled FTE"
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.filled_fte}
                        onChange={(e) =>
                          handleChange(i, "filled_fte", Number(e.target.value))
                        }
                        className="!m-0 !p-1 w-24 text-right"
                      />
                    </td>

                    <td
                      className={`border px-2 py-1 text-right font-semibold ${
                        (row.open_fte ?? 0) > 0
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {(row.open_fte ?? 0).toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
