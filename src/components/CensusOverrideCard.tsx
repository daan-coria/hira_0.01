import { useState, useEffect } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

type CensusRow = {
  id?: number
  date: string
  shift: string
  census_value: number
  adjusted_value: number
}

export default function CensusOverrideCard() {
  const { state } = useApp()
  const { facilitySetup, toolType } = state

  const [rows, setRows] = useState<CensusRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Automatically switch between mock JSON and real API
  const baseURL =
    import.meta.env.MODE === "development"
      ? "/mockdata"
      : "/api"

  useEffect(() => {
    if (facilitySetup && toolType === "IP") fetchCensus()
  }, [facilitySetup, toolType])

  const fetchCensus = async () => {
    try {
      if (!facilitySetup) return
      setLoading(true)
      setError(null)

      let url = ""
      if (baseURL === "/mockdata") {
        url = `${baseURL}/census-override.json`
      } else {
        const query = new URLSearchParams({
          facility: facilitySetup.facility,
          department: facilitySetup.department,
          costCenter: facilitySetup.costCenter,
          bedCount: String(facilitySetup.bedCount),
          start: facilitySetup.dateRange.start,
          end: facilitySetup.dateRange.end,
        })
        url = `${baseURL}/census-override?${query.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch census data")

      const data = await res.json()
      setRows(data)
    } catch (err: any) {
      console.error("Failed to load census data", err)
      setError(err.message || "Failed to load census data")
    } finally {
      setLoading(false)
    }
  }

  const saveRow = async (row: CensusRow) => {
    if (!facilitySetup) return
    if (!row.date || !row.shift) {
      alert("Please fill in both Date and Shift before saving.")
      return
    }

    try {
      setError(null)

      if (baseURL === "/mockdata") {
        // Local-only mock save
        setRows((prev) =>
          row.id
            ? prev.map((r) => (r.id === row.id ? row : r))
            : [...prev, { ...row, id: Date.now() }]
        )
        return
      }

      const method = row.id ? "PUT" : "POST"
      const url = row.id
        ? `${baseURL}/census-override/${row.id}`
        : `${baseURL}/census-override`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, ...facilitySetup }),
      })

      if (!res.ok) throw new Error("Failed to save census row")
      await fetchCensus()
    } catch (err: any) {
      console.error("Failed to save census row", err)
      setError(err.message || "Failed to save census row")
    }
  }

  const removeRow = async (id?: number) => {
    if (!facilitySetup || !id) return
    try {
      setError(null)

      if (baseURL === "/mockdata") {
        // Local-only mock delete
        setRows((prev) => prev.filter((r) => r.id !== id))
        return
      }

      const res = await fetch(`${baseURL}/census-override/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete census row")

      await fetchCensus()
    } catch (err: any) {
      console.error("Failed to delete census row", err)
      setError(err.message || "Failed to delete census row")
    }
  }

  if (toolType !== "IP") return null

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Census Override (IP Only)</h3>
        <Button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { date: "", shift: "", census_value: 0, adjusted_value: 0 },
            ])
          }
        >
          + Add Record
        </Button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-3 py-1 rounded mb-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading census data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Date</th>
                <th className="px-3 py-2 border">Shift</th>
                <th className="px-3 py-2 border text-right">Census Value</th>
                <th className="px-3 py-2 border text-right">Adjusted Value</th>
                <th className="px-3 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No census data found.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id || i}>
                    <td className="border px-2 py-1">
                      <Input
                        id={`date_${i}`}
                        label=""
                        type="date"
                        value={row.date}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, date: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    <td className="border px-2 py-1">
                      <Input
                        id={`shift_${i}`}
                        label=""
                        type="text"
                        value={row.shift}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, shift: e.target.value } : r
                            )
                          )
                        }
                        className="!m-0 !p-1"
                      />
                    </td>

                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`census_${i}`}
                        label=""
                        type="number"
                        min={0}
                        value={row.census_value}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, census_value: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-24 text-right"
                      />
                    </td>

                    <td className="border px-2 py-1 text-right">
                      <Input
                        id={`adj_${i}`}
                        label=""
                        type="number"
                        min={0}
                        value={row.adjusted_value}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i
                                ? { ...r, adjusted_value: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                        className="!m-0 !p-1 w-24 text-right"
                      />
                    </td>

                    <td className="border px-2 py-1 text-center space-x-2">
                      <Button
                        onClick={() => saveRow(row)}
                        variant="primary"
                        className="!px-2 !py-1 text-xs"
                      >
                        Save
                      </Button>
                      {row.id && (
                        <Button
                          onClick={() => removeRow(row.id)}
                          variant="ghost"
                          className="!px-2 !py-1 text-xs text-red-600"
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
