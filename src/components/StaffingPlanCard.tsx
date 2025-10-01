import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Customized,
} from 'recharts'
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

  const data = rows.map(r => ({
    deptShift: `${r.department} (${r.shift})`,
    start: r.start,
    end: r.end,
    duration: r.end - r.start,
    plannedFTE: r.plannedFTE,
    color: r.color,
  }))

  const CustomBars = (props: any) => {
    const chartWidth = props.width || 600
    const chartHeight = props.height || 300
    const barHeight = 20
    const yStep = chartHeight / (data.length + 1)

    return (
      <g>
        {data.map((entry, i) => {
          const y = (i + 1) * yStep
          const xStart = (entry.start / 30) * chartWidth
          const width = (entry.duration / 30) * chartWidth
          return (
            <g key={i}>
              <rect
                x={xStart}
                y={y}
                width={width}
                height={barHeight}
                fill={entry.color || '#10b981'}
                rx={6}
              />
              <text
                x={xStart + width + 5}
                y={y + barHeight / 2}
                dominantBaseline="middle"
                className="fill-gray-800 text-sm font-medium"
              >
                {entry.plannedFTE} FTE
              </text>
            </g>
          )
        })}
      </g>
    )
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Staffing Plan</h3>
        <button className="btn">Run Plan</button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 30]}
            label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
          />
          <YAxis type="category" dataKey="deptShift" width={150} />
          <Tooltip />
          <Customized component={CustomBars} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
