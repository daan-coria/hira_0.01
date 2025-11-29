import dayjs from "dayjs"
import {
    AvailabilityEntry,
    computeWeeklyFTE,
    } from "@/utils/useAvailabilityCalculator"

    type WeeklyFTEBarProps = {
    baseFTE: number
    availability?: AvailabilityEntry[]
    onWeekClick?: (weekStart: string) => void
    }

    export default function WeeklyFTEBar({
    baseFTE,
    availability,
    onWeekClick,
    }: WeeklyFTEBarProps) {
    // Always generate 52 weekly points (Sunday-based weeks)
    const startOfYear = dayjs().year() // current year
    const weeks: { weekStart: string; fte: number; reasons?: any[] }[] = []

    for (let i = 0; i < 52; i++) {
    const weekStart = dayjs().year(startOfYear).startOf("year").add(i, "week")
    weeks.push({
        weekStart: weekStart.format("YYYY-MM-DD"),
        fte: baseFTE,       // default FTE
        reasons: [],        // default no adjustments
    })
    }

    // Then apply availability adjustments if they exist
    if (availability && availability.length > 0) {
    const computed = computeWeeklyFTE(baseFTE, availability)
    // Merge computed FTE into 52-week base array
    computed.forEach((adj) => {
        const match = weeks.find((w) => w.weekStart === adj.weekStart)
        if (match) {
        match.fte = adj.fte
        match.reasons = adj.reasons
        }
    })
    }

    const weeklyPoints = weeks

    if (weeklyPoints.length === 0) {
        return null
    }

    return (
        <div className="flex gap-2 py-1 whitespace-nowrap">
            {weeklyPoints.map((point) => {
            // Build tooltip text using reasons returned by computeWeeklyFTE
            let tooltip: string

            if (!point.reasons || point.reasons.length === 0) {
                tooltip = `Base FTE: ${baseFTE}\nNo availability adjustments this week`
            } else {
                tooltip = point.reasons
                .map((r) => {
                    const range =
                    r.end && r.end.trim()
                        ? `${r.start} — ${r.end}`
                        : `${r.start} — Ongoing`
                    return `${r.type}: ${range}`
                })
                .join("\n")
            }

            return (
                <button
                key={point.weekStart}
                type="button"
                title={tooltip}
                onClick={() => onWeekClick?.(point.weekStart)}
                className="min-w-[88px] rounded-lg border border-gray-300 px-2 py-1 text-xs bg-white hover:bg-gray-50 flex flex-col items-center"
                >
                <span className="text-[10px] text-gray-500">
                    {dayjs(point.weekStart).format("M/D/YYYY")}
                </span>
                <span className="font-semibold">{point.fte.toFixed(1)}</span>
                </button>
            )
            })}
        </div>
        )
    }