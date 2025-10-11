import { apiFetch } from "@/utils/api"

// Toggle between mock data (local JSONs) and real API endpoints
const useMock = true

export const hiraApi = {
  // STEP 2: Resource Input
  async getResourceInput() {
    return useMock
      ? await apiFetch("resource-input.json")
      : await apiFetch("api/resource-input")
  },

  // STEP 3: Shift Configuration
  async getShiftConfigs() {
    return useMock
      ? await apiFetch("shift-config.json")
      : await apiFetch("api/shift-config")
  },

  // STEP 4: Staffing Configuration
  async getStaffingConfiguration() {
    return useMock
      ? await apiFetch("staffing-config.json")
      : await apiFetch("api/staffing-config")
  },

  // STEP 5: Availability Configuration
  async getAvailability() {
    return useMock
      ? await apiFetch("availability-config.json")
      : await apiFetch("api/availability-config")
  },

  // STEP 6: Census Override
  async getCensusOverride() {
    return useMock
      ? await apiFetch("census-override.json")
      : await apiFetch("api/census-override")
  },

  // STEP 7: Gap Summary
  async getGapSummary() {
    return useMock
      ? await apiFetch("gap-summary.json")
      : await apiFetch("api/gap-summary")
  }
}
