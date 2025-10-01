import { useState, useEffect } from 'react'

type PlanRow = {
  department: string
  shift: string
  start: number
  end: number
  plannedFTE: number
  color?: string
}

export default function StaffingPlanCard() {
  const [rows, setRows] = useState<PlanRow[]>([])

  useEffect(() => {
    // TODO: replace with API call
    // fetch("/api/staffing-plan")
    //   .then(res => res.json())
    //   .then(setRows)
    //   .catch(err => console.error("Failed to load staffing plan", err))
  }, [])

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Plan</h3>
        <button className="btn">Run Plan</button>
      </div>

      <div className="flex items-center justify-center h-40 text-gray-500">
        {/* Placeholder since charts are disabled */}
        <p>No staffing plan chart available</p>
      </div>
    </div>
  )
}
