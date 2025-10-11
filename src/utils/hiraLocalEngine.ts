export type ResourceRow = {
  id?: number
  first_name: string
  last_name: string
  position: string // RN | LPN | CNA | Clerk | ...
  unit_fte: number
  availability: string // Day | Night (informative only here)
  weekend_assignment?: string
  vacancy_status?: string
}

export type ShiftConfigRow = {
  id?: number
  role: string
  shift_label: string // Day | Night | ...
  start_hour: number
  end_hour: number
  hours_per_shift: number // usually 12 (nursing) or 8 (clerk)
}

export type StaffingConfigRow = {
  id?: number
  role: string
  ratio_mode: "Ratio" | "Fixed"
  max_ratio: number // Ratio: patients-per-staff; Fixed: fixed FTE
  include_in_ratio: boolean
  direct_care_percent: number // 0-100
  category: string
}

export type AvailabilityRow = {
  id?: number
  staff_name: string // "First Last"
  weekend_group: string // A | B | C | WC | ...
  pto_days: number
  loa_days: number
  available_shifts: number // remaining shifts in the cycle (user-entered)
}

export type CensusRow = {
  id?: number
  date: string // yyyy-mm-dd
  shift: string // Day | Night
  census_value: number
  adjusted_value: number // if 0 or missing, fall back to census_value
}

export type GapSummaryRow = {
  id?: number
  unit: string // we’ll output by role (RN, LPN, CNA, Clerk, etc.)
  requiredFTE: number
  actualFTE: number
  gapFTE: number // actual - required
  overUnder: "Understaffed" | "Overstaffed" | "Balanced"
  percentGap: number
}

// -------------------------------
// Tunables (align w/ v0.21 modeling)
// -------------------------------

// For local shell testing we assume a 2-week cycle and 12 possible shifts
// per FTE nurse when fully available, which matches the common pattern used
// in the workbook shell. You can tweak if your cycle differs.
const DEFAULT_PERIOD_SHIFTS = 12

// Guard number values
const n = (v: any, d = 0) => (Number.isFinite(+v) ? +v : d)

// Choose adjusted census when present; otherwise raw census
const pickCensus = (row: CensusRow) =>
  n(row?.adjusted_value) > 0 ? n(row.adjusted_value) : n(row.census_value)

// Average census across period
function averageCensus(census: CensusRow[]): number {
  if (!census || census.length === 0) return 0
  const sum = census.reduce((acc, c) => acc + pickCensus(c), 0)
  return sum / census.length
}

// Map "First Last" helper
const fullName = (r: ResourceRow) => `${r.first_name} ${r.last_name}`.trim()

// -------------------------------
// 1) Actual FTE calculator (by role)
// -------------------------------
export function computeActualFTEByRole(
  resources: ResourceRow[],
  availability: AvailabilityRow[],
  staffingConfig: StaffingConfigRow[]
): Record<string, number> {
  const directCareByRole: Record<string, number> = {}
  for (const cfg of staffingConfig) {
    directCareByRole[cfg.role] = Math.max(0, Math.min(100, n(cfg.direct_care_percent, 100)))
  }

  const byRole: Record<string, number> = {}

  for (const r of resources || []) {
    const name = fullName(r)
    const avail = availability?.find(a => a.staff_name === name)

    // Availability factor: remaining shifts / default shifts in cycle
    // If user didn’t enter available_shifts, assume fully available (factor=1)
    const shiftsAvail = n(avail?.available_shifts, DEFAULT_PERIOD_SHIFTS)
    const availabilityFactor =
      DEFAULT_PERIOD_SHIFTS > 0 ? Math.min(1, Math.max(0, shiftsAvail / DEFAULT_PERIOD_SHIFTS)) : 1

    // Direct-care factor by role (e.g., Clerk often 0, RN 100)
    const dcFactor = (directCareByRole[r.position] ?? 100) / 100

    // Effective FTE = base FTE * availability * direct-care share
    const effectiveFTE = n(r.unit_fte, 0) * availabilityFactor * dcFactor

    byRole[r.position] = n(byRole[r.position], 0) + effectiveFTE
  }

  // Round to one decimal place for display consistency
  for (const k of Object.keys(byRole)) byRole[k] = +byRole[k].toFixed(1)

  return byRole
}

// -------------------------------
// 2) Required FTE calculator (by role)
// -------------------------------
export function computeRequiredFTEByRole(
  staffingConfig: StaffingConfigRow[],
  census: CensusRow[]
): Record<string, number> {
  const avgCen = averageCensus(census)

  const byRole: Record<string, number> = {}

  for (const cfg of staffingConfig || []) {
    if (!cfg.include_in_ratio) {
      byRole[cfg.role] = 0
      continue
    }

    if (cfg.ratio_mode === "Ratio") {
      // Ratio is patients-per-staff (e.g., 4 means 1 staff per 4 patients)
      const denom = Math.max(n(cfg.max_ratio, 0), 0.0001) // avoid divide by zero
      byRole[cfg.role] = +(avgCen / denom).toFixed(1)
    } else {
      // Fixed means fixed FTE required
      byRole[cfg.role] = +n(cfg.max_ratio, 0).toFixed(1)
    }
  }

  return byRole
}

// -------------------------------
// 3) Gap Summary (v0.21 shell replication)
// -------------------------------
export function computeGapSummary(
  resources: ResourceRow[],
  shifts: ShiftConfigRow[],            // not used directly in this shell; kept for parity/future rules
  staffingConfig: StaffingConfigRow[],
  availability: AvailabilityRow[],
  census: CensusRow[]
): GapSummaryRow[] {
  // Base calculators
  const actualByRole = computeActualFTEByRole(resources, availability, staffingConfig)
  const requiredByRole = computeRequiredFTEByRole(staffingConfig, census)

  // Build final rows for roles present in config (sorted to keep UI stable)
  const roles = [...new Set(staffingConfig.map(c => c.role))].sort()

  const rows: GapSummaryRow[] = roles.map((role, idx) => {
    const required = n(requiredByRole[role], 0)
    const actual = n(actualByRole[role], 0)
    const gap = +(actual - required).toFixed(1)
    const pct = required > 0 ? +((gap / required) * 100).toFixed(1) : 0
    const overUnder: GapSummaryRow["overUnder"] =
      gap < 0 ? "Understaffed" : gap > 0 ? "Overstaffed" : "Balanced"

    return {
      id: idx + 1,
      unit: role, // we summarize by role (RN, LPN, CNA, Clerk, etc.)
      requiredFTE: +required.toFixed(1),
      actualFTE: +actual.toFixed(1),
      gapFTE: gap,
      overUnder,
      percentGap: pct,
    }
  })

  return rows
}
