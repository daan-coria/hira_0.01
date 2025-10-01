import { useState, useEffect } from 'react'

type GridRow = {
  facility: string
  department: string
  costCenter: number
  bedCount: number
  role: string
  ratio: number
  shift: string
  totalFTE: number
  workedHPUOS: number
  paidHPUOS: number
}

export default function StaffingConfigCard() {
  const [rows, setRows] = useState<GridRow[]>([])

  // Placeholder for backend integration
  useEffect(() => {
    // TODO: replace with real fetch
    // fetch("/api/staffing-grid")
    //   .then(res => res.json())
    //   .then(setRows)
    //   .catch(err => console.error("Failed to load staffing grid", err))
  }, [])

  const update = (i: number, patch: Partial<GridRow>) =>
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const addRow = () =>
    setRows(rs => [
      ...rs,
      {
        facility: '',
        department: '',
        costCenter: 0,
        bedCount: 0,
        role: '',
        ratio: 0,
        shift: '',
        totalFTE: 0,
        workedHPUOS: 0,
        paidHPUOS: 0,
      },
    ])

  const removeRow = (i: number) =>
    setRows(rs => rs.filter((_, idx) => idx !== i))

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Configuration (Grid)</h3>
        <button className="btn" onClick={addRow}>
          + Add Rule
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Department</th>
              <th>Cost Center</th>
              <th>Bed Count</th>
              <th>Role</th>
              <th>Ratio</th>
              <th>Shift</th>
              <th>Total FTE</th>
              <th>Worked HPUOS</th>
              <th>Paid HPUOS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="input"
                    value={r.facility}
                    onChange={e => update(i, { facility: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={r.department}
                    onChange={e => update(i, { department: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input w-24"
                    value={r.costCenter}
                    onChange={e => update(i, { costCenter: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input w-24"
                    value={r.bedCount}
                    onChange={e => update(i, { bedCount: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={r.role}
                    onChange={e => update(i, { role: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input w-20"
                    value={r.ratio}
                    onChange={e => update(i, { ratio: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <select
                    className="select"
                    value={r.shift}
                    onChange={e => update(i, { shift: e.target.value })}
                  >
                    <option value="">-</option>
                    <option>Day</option>
                    <option>Night</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    className="input w-20"
                    value={r.totalFTE}
                    onChange={e => update(i, { totalFTE: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input w-20"
                    value={r.workedHPUOS}
                    onChange={e => update(i, { workedHPUOS: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input w-20"
                    value={r.paidHPUOS}
                    onChange={e => update(i, { paidHPUOS: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button className="btn-ghost" onClick={() => removeRow(i)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
