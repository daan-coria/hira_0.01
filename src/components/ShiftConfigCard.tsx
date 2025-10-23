import { useState, useEffect, useCallback, useMemo } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import debounce from "lodash.debounce"

type ShiftConfigRow = {
  id?: number
  role: string
  shift_block: string
  shift_label: string
  start_hour: string
  end_hour: string
  hours_per_shift: number
}

type Props = { onNext?: () => void; onPrev?: () => void }

export default function ShiftConfigCard({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<ShiftConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const baseURL = import.meta.env.MODE === "development" ? "/mockdata" : "/api"

  // ---- Roles: union of Position Setup + Resource Input (deduped, sorted) ----
  const roleOptions = useMemo(() => {
    const fromPositions =
      Array.isArray(data.positions)
        ? (data.positions as any[])
            .map((p) => (typeof p === "string" ? p : p?.name))
            .filter(Boolean)
        : []

    const fromResource =
      Array.isArray(data.resourceInput)
        ? (data.resourceInput as any[])
            .map((r) => r?.position)
            .filter(Boolean)
        : []

    const unique = Array.from(new Set([...fromPositions, ...fromResource])) as string[]
    return (unique.length ? unique : ["RN", "LPN", "CNA", "Clerk"]).sort()
  }, [data.positions, data.resourceInput])

  // ---- Debounced autosave ----
  const debouncedSave = useCallback(
    debounce((updated: ShiftConfigRow[]) => {
      setSaving(true)
      updateData("shiftConfig", updated)
      setTimeout(() => setSaving(false), 600)
    }, 400),
    [updateData]
  )

  // ---- Load existing shift config or from mock, then normalize block labels ----
  useEffect(() => {
    if (Array.isArray(data.shiftConfig) && data.shiftConfig.length > 0) {
      const normalized = normalizeBlocks(data.shiftConfig)
      setRows(normalized)
      setLoading(false)
    } else {
      fetchShiftConfigs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchShiftConfigs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${baseURL}/shift-config.json`)
      if (!res.ok) throw new Error("Failed to load shift configurations")
      const json = (await res.json()) as ShiftConfigRow[]
      const normalized = normalizeBlocks(json)
      setRows(normalized)
      updateData("shiftConfig", normalized)
    } catch (e) {
      // start empty; user will add rows
      setRows([])
      updateData("shiftConfig", [])
    } finally {
      setLoading(false)
    }
  }

  // ---- Normalize/repair shift_block labels to Day 1..N when missing/invalid ----
  const normalizeBlocks = (input: ShiftConfigRow[]): ShiftConfigRow[] =>
    input.map((r, idx) => ({
      ...r,
      shift_block:
        r?.shift_block && /\S/.test(r.shift_block) ? r.shift_block : `Day ${idx + 1}`,
    }))

  // ---- Hours calc (handles overnight) ----
  const calcHours = (start: string, end: string) => {
    if (!start || !end) return 0
    const s = Number(start)
    const e = Number(end)
    if (isNaN(s) || isNaN(e)) return 0
    const diff = e >= s ? e - s : 24 - s + e
    return diff === 0 ? 24 : diff
  }

  // ---- Change handler ----
  const handleChange = (index: number, field: keyof ShiftConfigRow, value: any) => {
    const updated = rows.map((r, i) => {
      if (i !== index) return r
      const next = { ...r, [field]: value }
      if (field === "start_hour" || field === "end_hour") {
        next.hours_per_shift = calcHours(next.start_hour, next.end_hour)
      }
      return next
    })
    setRows(updated)
    debouncedSave(updated)
  }

  // ---- Next "Day N" based on existing highest N (robust after reload/deletes) ----
  const nextBlockName = () => {
    const maxN =
      rows.reduce((max, r) => {
        const m = /(\d+)$/.exec(r.shift_block || "")
        return Math.max(max, m ? parseInt(m[1], 10) : 0)
      }, 0) || 0
    return `Day ${maxN + 1}`
  }

  const addRow = () => {
    const newRow: ShiftConfigRow = {
      id: Date.now(),
      role: "",
      shift_block: nextBlockName(),
      shift_label: "",
      start_hour: "",
      end_hour: "",
      hours_per_shift: 0,
    }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Shift Configuration</h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addRow}>+ Add Shift</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading shift configurations...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Shift Block</th>
                <th className="px-3 py-2 border">Shift Label</th>
                <th className="px-3 py-2 border text-right">Start Hour</th>
                <th className="px-3 py-2 border text-right">End Hour</th>
                <th className="px-3 py-2 border text-right">Hours / Shift</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No shifts defined yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    {/* Role */}
                    <td className="border px-2 py-1">
                      <Select
                        id={`role_${i}`}
                        label=""
                        value={row.role}
                        onChange={(e) => handleChange(i, "role", e.target.value)}
                        className="!m-0 !p-1"
                      >
                        <option value="">-- Select Role --</option>
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    </td>

                    {/* Shift Block (auto-incremented but editable) */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`block_${i}`}
                        value={row.shift_block}
                        onChange={(e) => handleChange(i, "shift_block", e.target.value)}
                        className="!m-0 !p-1 w-28"
                      />
                    </td>

                    {/* Shift Label (free text) */}
                    <td className="border px-2 py-1">
                      <Input
                        id={`label_${i}`}
                        value={row.shift_label}
                        placeholder="e.g. Day, Night, Custom"
                        onChange={(e) => handleChange(i, "shift_label", e.target.value)}
                        className="!m-0 !p-1 w-32"
                      />
                    </td>

                    {/* Start / End hour */}
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`start_${i}`}
                        type="number"
                        min={0}
                        max={23}
                        value={row.start_hour}
                        onChange={(e) => handleChange(i, "start_hour", e.target.value)}
                        placeholder="Start"
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>
                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`end_${i}`}
                        type="number"
                        min={0}
                        max={23}
                        value={row.end_hour}
                        onChange={(e) => handleChange(i, "end_hour", e.target.value)}
                        placeholder="End"
                        className="!m-0 !p-1 w-20 text-right"
                      />
                    </td>

                    {/* Hours / Shift */}
                    <td className="border px-2 py-1 text-right bg-gray-50">
                      {row.hours_per_shift ? row.hours_per_shift.toFixed(1) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onPrev}>← Previous</Button>
        <Button variant="primary" onClick={onNext}>Next →</Button>
      </div>
    </Card>
  )
}
