export type Household = {
  id: string
  org_id: string | null
  household_no: string
  name: string
  address: string
  email: string | null
  phone: string | null
  created_at: string
}

export type HouseholdFormData = {
  household_no: string
  name: string
  address: string
  email: string
  phone: string
}