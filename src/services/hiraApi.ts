import { apiFetch } from "@/utils/api"

const useMock = true

export const hiraApi = {
  async getFacility() {
    return useMock
      ? await apiFetch("facility.json")
      : await apiFetch("api/facility")
  },

  async getResourceInput() {
    return useMock
      ? await apiFetch("resource-input.json")
      : await apiFetch("api/resource-input")
  },

  async getStaffingConfiguration() {
    return useMock
      ? await apiFetch("staffing-config.json")
      : await apiFetch("api/staffing-config")
  },

  async getShiftConfigs() {
    return useMock
      ? await apiFetch("shift-config.json")
      : await apiFetch("api/shift-config")
  },

  async getAvailability() {
    return useMock
      ? await apiFetch("availability-config.json")
      : await apiFetch("api/availability-config")
  },

  async getCensus() {
    return useMock
      ? await apiFetch("census.json")
      : await apiFetch("api/census")
  },

  async getStaffingRequirements() {
    return useMock
      ? await apiFetch("staffing-requirements.json")
      : await apiFetch("api/staffing-requirements")
  },

  async getStaffingPlan() {
    return useMock
      ? await apiFetch("staffing-plan.json")
      : await apiFetch("api/staffing-plan")
  },

  async getGapSummary() {
    return useMock
      ? await apiFetch("gap-summary.json")
      : await apiFetch("api/gap-summary")
  },

  async getPositionControl() {
    return useMock
      ? await apiFetch("position-control.json")
      : await apiFetch("api/position-control")
  }
}
