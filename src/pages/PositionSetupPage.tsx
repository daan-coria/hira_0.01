import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import debounce from "lodash.debounce"

type PositionRow = {
  id?: number
  name: string
}

type Props = {
  onNext?: () => void
  onPrev?: () => void
}

export default function PositionSetupPage({ onNext, onPrev }: Props) {
  const { data, updateData } = useApp()
  const [rows, setRows] = useState<PositionRow[]>([])
  const [saving, setSaving] = useState(false)

  // ✅ Debounced autosave
  const debouncedSave = useCallback(
    debounce((updated: PositionRow[]) => {
      setSaving(true)
      updateData("positions", updated.map((p) => p.name))
      setTimeout(() => setSaving(false), 500)
    }, 400),
    [updateData]
  )

  // ✅ Initialize from stored data or fallback
  useEffect(() => {
    const initial = (data.positions || ["RN", "LPN", "CNA", "Clerk"]).map((p, i) => ({
      id: i + 1,
      name: p,
    }))
    setRows(initial)
  }, [data.positions])

  const handleChange = (index: number, value: string) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, name: value } : r))
    setRows(updated)
    debouncedSave(updated)
  }

  const addRow = () => {
    const newRow: PositionRow = { id: Date.now(), name: "" }
    const updated = [...rows, newRow]
    setRows(updated)
    debouncedSave(updated)
  }

  const removeRow = (id?: number) => {
    const updated = rows.filter((r) => r.id !== id)
    setRows(updated)
    debouncedSave(updated)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Step 1.5 — Position Setup
        </h3>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-500">Saving…</span>}
          <Button onClick={addRow}>+ Add Position</Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No positions defined yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border text-left">Position Name</th>
                <th className="px-3 py-2 border text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td className="border px-2 py-1">
                    <Input
                      id={`pos_${i}`}
                      label=""
                      value={row.name}
                      placeholder="Enter Position"
                      onChange={(e) => handleChange(i, e.target.value)}
                      className="!m-0 !p-1 w-full"
                    />
                  </td>

                  <td className="border px-2 py-1 text-center">
                    <Button
                      onClick={() => removeRow(row.id)}
                      variant="ghost"
                      className="!px-2 !py-1 text-xs text-red-600"
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onPrev}>
          ← Previous
        </Button>
        <Button variant="primary" onClick={onNext}>
          Continue →
        </Button>
      </div>
    </Card>
  )
}
