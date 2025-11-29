import { AvailabilityEntry } from "@/utils/useAvailabilityCalculator"

export type ResourceRow = {
  id?: number
  campus: string
  cost_center_name: string
  employee_id: string
  first_name: string
  last_name: string
  position: string
  job_name: string
  unit_fte: number
  shift: string
  shift_group: string
  weekend_group: string
  start_date: string
  end_date: string
  vacancy_status: string
  availability?: AvailabilityEntry[]
  schedule_system_id?: string
  ehr_id?: string
  primary_cost_center_id?: string
  primary_job_category_id?: string
  primary_job_category_name?: string
  primary_job_code_id?: string
  expected_hours_per_week?: number | null
  term_date?: string
  seniority_date?: string
  seniority_value?: string
  report_to_id?: string
  report_to_name?: string
}
