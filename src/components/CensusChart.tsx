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
      <div className="flex items-center justify-center h-40 text-gray-500">
        {/* Placeholder since charts are disabled */}
        <p>No chart available</p>
      </div>
    </div>
  )
}
