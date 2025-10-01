import { useState, useMemo, useEffect } from 'react'

type GapRow = {
  department: string
  shift: string
  available: number
  required: number
}

export default function GapSummaryCard() {
  const [rows, setRows] = useState<GapRow[]>([])

  useEffect(() => {
    // TODO: replace with API call
    // fetch("/api/gap-summary")
    //   .then(res => res.json())
    //   .then(setRows)
    //   .catch(err => console.error("Failed to load gap summary", err))
  }, [])

  const update = (i: number, patch: Partial<GapRow>) =>
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const totals = useMemo(() => {
    const available = rows.reduce((a, r) => a + r.available, 0)
    const required = rows.reduce((a, r) => a + r.required, 0)
    return { available, required, gap: available - required }
  }, [rows])

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Gap Summary</h3>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Shift</th>
              <th>Available FTE</th>
              <th>Required FTE</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const gap = r.available - r.required
              const gapClass =
                gap < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'

              return (
                <tr key={i}>
                  <td>
                    <input
                      className="input"
                      value={r.department}
                      onChange={e => update(i, { department: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className="select"
                      value={r.shift}
                      onChange={e => update(i, { shift: e.target.value })}
                    >
                      <option>Day</option>
                      <option>Night</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input w-24"
                      value={r.available}
                      onChange={e => update(i, { available: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input w-24"
                      value={r.required}
                      onChange={e => update(i, { required: Number(e.target.value) })}
                    />
                  </td>
                  <td className={gapClass}>{gap}</td>
                </tr>
              )
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={2}>Totals</td>
                <td>{totals.available}</td>
                <td>{totals.required}</td>
                <td className={totals.gap < 0 ? 'text-red-600' : 'text-green-600'}>
                  {totals.gap}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
