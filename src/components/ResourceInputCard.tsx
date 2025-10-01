import { useState, useEffect } from 'react'

type Row = {
  vacancy: string
  lastName: string
  firstName: string
  weekend: string
  position: string
  unitFTE: number
  availability: string
}

export default function ResourceInputCard() {
  const [rows, setRows] = useState<Row[]>([])

  // Later replace with actual API call to your backend
  useEffect(() => {
    fetch("/api/resource-input")
      .then(res => res.json())
      .then(setRows)
      .catch(() => setRows([])) // fallback: keep empty if API not ready
  }, [])

  const updateRow = (i: number, key: keyof Row, val: any) => {
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)))
  }

  const addRow = () => {
    setRows(rs => [
      ...rs,
      { vacancy: '', lastName: '', firstName: '', weekend: '', position: '', unitFTE: 0, availability: '' }
    ])
  }

  const removeRow = (i: number) => {
    setRows(rs => rs.filter((_, idx) => idx !== i))
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Resource Input</h3>
        <button className="btn" onClick={addRow}>+ Add Staff</button>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Vacancy</th>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Weekend</th>
              <th>Position</th>
              <th>Unit FTEs</th>
              <th>Availability</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <select
                    className="select"
                    value={r.vacancy}
                    onChange={e => updateRow(i, 'vacancy', e.target.value)}
                  >
                    <option value="">-</option>
                    <option>Filled</option>
                    <option>Open</option>
                    <option>Posted</option>
                  </select>
                </td>
                <td>
                  <input
                    className="input"
                    value={r.lastName}
                    onChange={e => updateRow(i, 'lastName', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={r.firstName}
                    onChange={e => updateRow(i, 'firstName', e.target.value)}
                  />
                </td>
                <td>
                  <select
                    className="select"
                    value={r.weekend}
                    onChange={e => updateRow(i, 'weekend', e.target.value)}
                  >
                    <option value="">-</option>
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>WC</option>
                  </select>
                </td>
                <td>
                  <select
                    className="select"
                    value={r.position}
                    onChange={e => updateRow(i, 'position', e.target.value)}
                  >
                    <option value="">-</option>
                    <option>RN</option>
                    <option>LPN</option>
                    <option>CNA</option>
                    <option>Unit Clerk</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-24"
                    value={r.unitFTE}
                    onChange={e => updateRow(i, 'unitFTE', parseFloat(e.target.value))}
                  />
                </td>
                <td>
                  <select
                    className="select"
                    value={r.availability}
                    onChange={e => updateRow(i, 'availability', e.target.value)}
                  >
                    <option value="">-</option>
                    <option>Day</option>
                    <option>Night</option>
                  </select>
                </td>
                <td>
                  <button className="btn-ghost" onClick={() => removeRow(i)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
