import dayjs, { Dayjs } from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type AvailabilityEntry = {
  id: string
  type: string // Orientation, FMLA, PTO, Increased Availability, etc.
  start: string // "YYYY-MM-DD"
  end: string | null // null = Ongoing
  fte: number
}

export type WeeklyFTEPoint = {
  weekStart: string // "YYYY-MM-DD" Sunday of that week
  fte: number
  reasons: { type: string; start: string; end: string | null }[]
}

const toDay = (value: string | null | undefined): Dayjs | null => {
  if (!value || !value.trim()) return null
  return dayjs(value, "YYYY-MM-DD")
}

const weekStartSunday = (d: Dayjs): Dayjs => d.startOf("week") // Sunday in US locale

export function computeWeeklyFTE(
  baseFTE: number,
  availability: AvailabilityEntry[],
  options?: {
    horizonStart?: string | null
    horizonEnd?: string | null
    maxWeeks?: number
  }
): WeeklyFTEPoint[] {
  if (!availability || availability.length === 0) return []

  const maxWeeks = options?.maxWeeks ?? 52

  // Sort entries by start date so "later" entries override earlier ones
  const entries = [...availability].sort((a, b) => {
    const ad = toDay(a.start)
    const bd = toDay(b.start)
    if (!ad || !bd) return 0
    return ad.valueOf() - bd.valueOf()
  })

  // Determine horizon
  let earliestStart: Dayjs | null = null
  let latestEnd: Dayjs | null = null

  for (const e of entries) {
    const s = toDay(e.start)
    const ed = e.end ? toDay(e.end) : null
    if (s && (!earliestStart || s.isBefore(earliestStart))) earliestStart = s
    if (ed && (!latestEnd || ed.isAfter(latestEnd))) latestEnd = ed
  }

  if (!earliestStart) return []

  const horizonStart =
    (options?.horizonStart && toDay(options.horizonStart)) ||
    earliestStart

  // If we have any "ongoing" entries, give ourselves a default horizon tail
  const hasOngoing = entries.some((e) => !e.end)
  const defaultTail = hasOngoing ? earliestStart.add(26, "week") : earliestStart

  const horizonEnd =
    (options?.horizonEnd && toDay(options.horizonEnd)) ||
    latestEnd ||
    defaultTail

  if (!horizonEnd) return []

  let current = weekStartSunday(horizonStart)
  const last = weekStartSunday(horizonEnd)

  const points: WeeklyFTEPoint[] = []
  let safety = 0

  while (current.isSameOrBefore(last) && safety < maxWeeks) {
    safety += 1
    let fte = baseFTE
    const active: AvailabilityEntry[] = []

    for (const e of entries) {
      const s = toDay(e.start)
      const ed = e.end ? toDay(e.end) : null
      if (!s) continue

      const startsOnOrBefore = !current.isBefore(s, "day")
      const endsOnOrAfter = !ed || !current.isAfter(ed, "day")

      if (startsOnOrBefore && endsOnOrAfter) {
        active.push(e)
      }
    }

    if (active.length > 0) {
      // "Last" entry (latest start) wins for FTE override
      const lastActive = [...active].sort((a, b) => {
        const ad = toDay(a.start)!
        const bd = toDay(b.start)!
        return ad.valueOf() - bd.valueOf()
      })[active.length - 1]

      fte = lastActive.fte
    }

    points.push({
      weekStart: current.format("YYYY-MM-DD"),
      fte,
      reasons: active.map((a) => ({
        type: a.type,
        start: a.start,
        end: a.end,
      })),
    })

    current = current.add(1, "week")
  }

  return points
}
