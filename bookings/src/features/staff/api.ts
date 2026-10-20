import { apiRequest } from '../../lib/apiClient'
import type { StaffMember, PendingApplicant } from '../../types/staff'

export function listStaff(propertyId?: string) {
  return apiRequest<StaffMember[]>('/admin/staff', { query: { propertyId } })
}

export interface CreateStaffInput {
  email: string
  firstName: string
  lastName: string
  role: 'staff' | 'admin'
  propertyId: string
}

// export function createStaff(input: CreateStaffInput) {
//   return apiRequest<StaffMember & { tempPassword: string }>('/admin/staff', { method: 'POST', body: input })
// }

export function createStaff(input: CreateStaffInput) {
  return apiRequest<StaffMember>('/admin/staff', { method: 'POST', body: input })
}

export function updateStaff(id: string, input: Partial<{ role: string; propertyId: string; isActive: boolean }>) {
  return apiRequest<StaffMember>(`/admin/staff/${id}`, { method: 'PATCH', body: input })
}

export function deactivateStaff(id: string) {
  return apiRequest(`/admin/staff/${id}`, { method: 'DELETE' })
}

// -- Pending applicants (Google Form onboarding) --

export function listPendingApplicants() {
  return apiRequest<PendingApplicant[]>('/admin/staff/pending')
}

export function invitePendingApplicant(id: string, propertyId: string, role: 'staff' | 'admin') {
  return apiRequest<PendingApplicant>(`/admin/staff/pending/${id}/invite`, {
    method: 'POST', body: { propertyId, role }
  })
}

export function rejectPendingApplicant(id: string) {
  return apiRequest(`/admin/staff/pending/${id}`, { method: 'DELETE' })
}