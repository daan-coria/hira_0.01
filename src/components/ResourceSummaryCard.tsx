import React, { useState, useEffect } from 'react'

function MiniLine({ points }: { points: number[] }) {
  const w = 220, h = 60, pad = 6
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const span = Math.max(max - min, 1)
  const xStep = (w - pad * 2) / (points.length - 1 || 1)

  const path = points
    .map((v, i) => {
      const x = pad + i * xStep
      const y = h - pad - ((v - min) / span) * (h - pad * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-brand-600">
      <rect x="0" y="0" width={w} height={h} rx="10" className="fill-white" />
      <path d={path} stroke="currentColor" strokeWidth="2" fill="none" />
      {points.map((v, i) => {
        const x = pad + i * xStep
        const y = h - pad - ((v - min) / span) * (h - pad * 2)
        return <circle key={i} cx={x} cy={y} r="3" className="fill-current" />
      })}
    </svg>
  )
}

// Simple heatmap cell
function HeatCell({ pct }: { pct: number }) {
  const bg =
    pct >= 85 ? 'bg-green-100 text-green-800' :
    pct >= 75 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'
  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-medium text-center ${bg}`}>
      {pct}%
    </div>
  )
}

export default function ResourceSummaryCard() {
  const [today, setToday] = useState<string>("")
  const [totalFTE, setTotalFTE] = useState<number>(0)
  const [staffingGap, setStaffingGap] = useState<number>(0)
  const [coverage, setCoverage] = useState<number>(0)
  const [heatmap, setHeatmap] = useState<{ dept: string; values: number[] }[]>([])
  const [trend, setTrend] = useState<number[]>([])

  useEffect(() => {
    setToday(new Date().toLocaleDateString())

    // TODO: replace with API call
    // fetch("/api/resource-summary")
    //   .then(res => res.json())
    //   .then(data => {
    //     setTotalFTE(data.totalFTE)
    //     setStaffingGap(data.staffingGap)
    //     setCoverage(data.coverage)
    //     setHeatmap(data.heatmap)
    //     setTrend(data.trend)
    //   })
    //   .catch(err => console.error("Failed to load resource summary", err))
  }, [])

  return (
    <div className="card p-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Resource Input</h3>
        <div className="flex items-center gap-2">
          <button className="btn-ghost">📅 <span className="ml-1">{today}</span></button>
          <button className="btn">Upload File</button>
        </div>
      </div>

      {/* Stats + heatmap + chart */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total FTE</div>
            <div className="mt-1 text-2xl font-bold">{totalFTE}</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Staffing gap</div>
            <div className="mt-1 text-2xl font-bold text-red-600">{staffingGap}</div>
            <div className="text-xs text-gray-500">FTEs</div>
          </div>

          {/* Heatmap */}
          <div className="lg:col-span-2">
            <div className="text-sm text-gray-700 mb-2">Heatmap</div>
            {heatmap.length === 0 ? (
              <p className="text-gray-400 text-sm">No data</p>
            ) : (
              <div>
                <div className="grid grid-cols-4 gap-2">
                  {heatmap.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <div className="text-xs text-gray-500 pt-2">{row.dept}</div>
                      {row.values.map((v, i) => (
                        <HeatCell key={i} pct={v} />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                <div className="grid grid-cols-4 text-xs text-gray-500 mt-1">
                  <div />
                  <div className="text-center">Afternoon</div>
                  <div className="text-center">Evening</div>
                  <div className="text-center">Night</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coverage chart */}
        <div className="rounded-2xl border border-gray-200 p-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Coverage</div>
              <div className="text-2xl font-bold text-brand-700">{coverage}%</div>
            </div>
            <div className="text-xs text-gray-500">Last {trend.length} points</div>
          </div>
          <div className="mt-2">
            {trend.length > 0 ? <MiniLine points={trend} /> : <p className="text-gray-400 text-sm">No trend data</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
