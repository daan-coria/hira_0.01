import { useEffect, useState } from "react"
import { useApp } from "@/store/AppContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

// Result row type
type GapSummaryRow = {
  id?: number
  unit: string
  requiredFTE: number
  actualFTE: number
  gapFTE: number
  overUnder: string
  percentGap: number
}

type Props = {
  onPrev?: () => void
  onReset?: () => void
}

export default function GapSummaryCard({ onPrev, onReset }: Props) {
  const { data } = useApp()
  const [rows, setRows] = useState<GapSummaryRow[]>([])

  // --------------------------------------------------
  // ⚙️ Recalculate whenever inputs change
  // --------------------------------------------------
  useEffect(() => {
    calculateGapSummary()
  }, [
    data.resourceInput,
    data.staffingConfig,
    data.availabilityConfig,
    data.censusOverride,
  ])

  const calculateGapSummary = () => {
    if (
      data.resourceInput.length === 0 ||
      data.staffingConfig.length === 0 ||
      data.censusOverride.length === 0
    ) {
      setRows([])
      return
    }

    // ---- 1. Determine Average Census ----
    const censusValues = data.censusOverride
      .map((r: any) => Number(r.census))
      .filter((n) => !isNaN(n))
    const avgCensus =
      censusValues.length > 0
        ? censusValues.reduce((a, b) => a + b, 0) / censusValues.length
        : 0

    // ---- 2. Build StaffingConfig map ----
    const configMap: Record<
      string,
      { mode: string; maxRatio: number; include: boolean; directCare: number }
    > = {}
    data.staffingConfig.forEach((r: any) => {
      configMap[r.role] = {
        mode: r.ratio_mode,
        maxRatio: Number(r.max_ratio) || 0,
        include: Boolean(r.include_in_ratio),
        directCare: Number(r.direct_care_percent) || 100,
      }
    })

    // ---- 3. Aggregate Actual FTE by Role ----
    const actualFTE: Record<string, number> = {}
    data.resourceInput.forEach((r: any) => {
      const role = r.position
      const fte = Number(r.unit_fte) || 0
      const conf = configMap[role]
      const direct = conf ? conf.directCare / 100 : 1
      actualFTE[role] = (actualFTE[role] || 0) + fte * direct
    })

    // ---- 4. Calculate Required FTE per Role ----
    const requiredFTE: Record<string, number> = {}
    Object.entries(configMap).forEach(([role, cfg]) => {
      if (cfg.mode === "Fixed") {
        requiredFTE[role] = cfg.maxRatio
      } else if (cfg.include && cfg.maxRatio > 0) {
        requiredFTE[role] = avgCensus / cfg.maxRatio
      } else {
        requiredFTE[role] = 0
      }
    })

    // ---- 5. Compose Summary Rows ----
    const roles = Array.from(
      new Set([
        ...Object.keys(requiredFTE),
        ...Object.keys(actualFTE),
      ])
    )

    const summary = roles.map((role, i) => {
      const req = requiredFTE[role] || 0
      const act = actualFTE[role] || 0
      const gap = act - req
      const overUnder =
        gap > 0
          ? "Overstaffed"
          : gap < 0
          ? "Understaffed"
          : "Balanced"
      const pct = req === 0 ? 0 : (gap / req) * 100
      return {
        id: i + 1,
        unit: role,
        requiredFTE: req,
        actualFTE: act,
        gapFTE: gap,
        overUnder,
        percentGap: pct,
      }
    })

    setRows(summary)
  }

  // --------------------------------------------------
  // 🧮 Render
  // --------------------------------------------------
  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Gap Summary
      </h3>

      {rows.length === 0 ? (
        <p className="text-gray-500">
          Not enough data. Please complete previous steps.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 border text-left">Role</th>
                <th className="px-3 py-2 border text-right">Required FTE</th>
                <th className="px-3 py-2 border text-right">Actual FTE</th>
                <th className="px-3 py-2 border text-right">Gap FTE</th>
                <th className="px-3 py-2 border text-center">Over/Under</th>
                <th className="px-3 py-2 border text-right">% Gap</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td className="border px-2 py-1">{r.unit}</td>
                  <td className="border px-2 py-1 text-right">
                    {r.requiredFTE.toFixed(2)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {r.actualFTE.toFixed(2)}
                  </td>
                  <td
                    className={`border px-2 py-1 text-right font-semibold ${
                      r.gapFTE < 0
                        ? "text-red-600"
                        : r.gapFTE > 0
                        ? "text-green-600"
                        : "text-gray-700"
                    }`}
                  >
                    {r.gapFTE.toFixed(2)}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {r.overUnder}
                  </td>
                  <td
                    className={`border px-2 py-1 text-right font-medium ${
                      r.percentGap < 0
                        ? "text-red-600"
                        : r.percentGap > 0
                        ? "text-green-600"
                        : "text-gray-700"
                    }`}
                  >
                    {r.percentGap.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onPrev}>
          ← Previous
        </Button>
        <Button variant="primary" onClick={onReset}>
          🔄 Reset Wizard
        </Button>
      </div>
    </Card>
  )
}
