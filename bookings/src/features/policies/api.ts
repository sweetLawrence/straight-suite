    import { apiRequest } from '../../lib/apiClient'
import type { CancellationPolicy, CancellationTier } from '../../types/policy'

export function listPolicies(propertyId?: string) {
  return apiRequest<CancellationPolicy[]>('/admin/cancellation-policies', { query: { propertyId } })
}

export interface PolicyInput {
  name: string
  tiers: CancellationTier[]
  depositPct: number
  isDefault?: boolean
}

export function createPolicy(input: PolicyInput, propertyId?: string) {
  return apiRequest<CancellationPolicy>('/admin/cancellation-policies', {
    method: 'POST', body: input, query: { propertyId }
  })
}

export function updatePolicy(id: string, input: Partial<PolicyInput>, propertyId?: string) {
  return apiRequest<CancellationPolicy>(`/admin/cancellation-policies/${id}`, {
    method: 'PATCH', body: input, query: { propertyId }
  })
}

export function deletePolicy(id: string, propertyId?: string) {
  return apiRequest(`/admin/cancellation-policies/${id}`, { method: 'DELETE', query: { propertyId } })
}

export function setDefaultPolicy(id: string, propertyId?: string) {
  return apiRequest<CancellationPolicy>(`/admin/cancellation-policies/${id}/set-default`, {
    method: 'PATCH', query: { propertyId }
  })
}