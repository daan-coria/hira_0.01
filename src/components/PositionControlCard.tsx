import { useState, useEffect } from 'react'

type PositionRow = {
  department: string
  position: string
  budgeted: number
  filled: number
}

export default function PositionControlCard() {
  const [rows, setRows] = useState<PositionRow[]>([])

  useEffect(() => {
    // TODO: replace with API call
    // fetch("/api/position-control")
    //   .then(res => res.json())
    //   .then(setRows)
    //   .catch(err => console.error("Failed to load position control", err))
  }, [])

  const update = (i: number, patch: Partial<PositionRow>) =>
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const addRow = () =>
    setRows(rs => [...rs, { department: '', position: '', budgeted: 0, filled: 0 }])

  const removeRow = (i: number) =>
    setRows(rs => rs.filter((_, idx) => idx !== i))

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Position Control</h3>
        <button className="btn" onClick={addRow}>
          + Add
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Position</th>
              <th>Budgeted FTE</th>
              <th>Filled FTE</th>
              <th>Open FTE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const open = r.budgeted - r.filled
              const openClass =
                open < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'

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
                    <input
                      className="input"
                      value={r.position}
                      onChange={e => update(i, { position: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input w-24"
                      value={r.budgeted}
                      onChange={e => update(i, { budgeted: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input w-24"
                      value={r.filled}
                      onChange={e => update(i, { filled: Number(e.target.value) })}
                    />
                  </td>
                  <td className={openClass}>{open}</td>
                  <td>
                    <button className="btn-ghost" onClick={() => removeRow(i)}>
                      🗑
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
