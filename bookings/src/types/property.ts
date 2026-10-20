export interface PropertySettings {
  id: string
  slug: string
  name: string
  timezone: string
  currency: string
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  checkInTime: string
  checkOutTime: string
  isActive: boolean
}