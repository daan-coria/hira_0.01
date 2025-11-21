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
    // If there is no availability data at all, we keep showing
    // the "Edit Availability" button in the parent component.
    if (!availability || availability.length === 0) {
        return null
    }

    const weeklyPoints = computeWeeklyFTE(baseFTE, availability)

    if (weeklyPoints.length === 0) {
        return null
    }

    return (
        <div className="flex gap-2 overflow-x-auto py-1 whitespace-nowrap max-w-full">
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