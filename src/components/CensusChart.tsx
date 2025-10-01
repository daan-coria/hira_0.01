import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { useEffect, useState } from 'react'

type CensusRow = {
  hour: number
  census_value: number
  projected_census: number
  day_name: string
  season: string
  shift: string
}

export default function CensusChart() {
  const [data, setData] = useState<CensusRow[]>([])

  useEffect(() => {
    // TODO: replace with real fetch from your backend
    // Example:
    // fetch("/api/census-input")
    //   .then(res => res.json())
    //   .then(setData)
    //   .catch(err => console.error("Failed to load census data", err))
  }, [])

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Census Points</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
          />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="census_value"
            stroke="#34d399"
            strokeWidth={2}
            name="Actual Census"
          />
          <Line
            type="monotone"
            dataKey="projected_census"
            stroke="#60a5fa"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Projected"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
