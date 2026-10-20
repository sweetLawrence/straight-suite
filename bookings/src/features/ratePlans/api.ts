import { apiRequest } from '../../lib/apiClient'
import type { RatePlan } from '../../types/ratePlan'

export function listRatePlans(propertyId?: string, roomTypeId?: string) {
  return apiRequest<RatePlan[]>('/admin/rate-plans', { query: { propertyId, roomTypeId } })
}

export interface RatePlanInput {
  roomTypeId: string
  name: string
  priceOverride: number
  cancellationPolicyId?: string | null
  validFrom: string
  validTo: string
  boardType?: 'bb' | 'hb' | 'fb' | null
}

export function createRatePlan(input: RatePlanInput, propertyId?: string) {
  return apiRequest<RatePlan>('/admin/rate-plans', { method: 'POST', body: input, query: { propertyId } })
}

export function updateRatePlan(id: string, input: Partial<RatePlanInput & { isActive: boolean }>, propertyId?: string) {
  return apiRequest<RatePlan>(`/admin/rate-plans/${id}`, { method: 'PATCH', body: input, query: { propertyId } })
}

export function deleteRatePlan(id: string, propertyId?: string) {
  return apiRequest(`/admin/rate-plans/${id}`, { method: 'DELETE', query: { propertyId } })
}