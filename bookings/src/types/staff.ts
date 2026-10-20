export type StaffRole = 'staff' | 'admin'

export interface StaffMember {
  id: string
  email: string
  firstName: string
  lastName: string
  role: StaffRole
  propertyId: string | null
  isActive: boolean
}

export interface PendingApplicant {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
}