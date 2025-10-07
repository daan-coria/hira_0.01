// src/services/hiraApi.ts
import { apiFetch } from "@/utils/api"

// (Optional) light types so TS helps you
export type GapRow = { unit: string; requiredFTE: number; actualFTE: number; gap: number }

export const hiraApi = {
  getFacility() {
    return apiFetch("/api/facility") as Promise<any[]>
  },
  getResourceInput() {
    return apiFetch("/api/resource-input") as Promise<any[]>
  },
  getStaffingConfiguration() {
    return apiFetch("/api/staffing-configuration") as Promise<any[]>
  },
  getShiftConfigs() {
    return apiFetch("/api/shift-configs") as Promise<any[]>
  },
  getAvailability() {
    return apiFetch("/api/availability") as Promise<any[]>
  },
  getCensus() {
    return apiFetch("/api/census") as Promise<any[]>
  },
  getStaffingRequirements() {
    return apiFetch("/api/staffing-requirements") as Promise<any[]>
  },
  getStaffingPlan() {
    return apiFetch("/api/staffing-plan") as Promise<any[]>
  },
  getGapSummary() {
    return apiFetch("/api/gap-summary") as Promise<GapRow[]>
  },
  getPositionControl() {
    return apiFetch("/api/position-control") as Promise<any[]>
  },
}
