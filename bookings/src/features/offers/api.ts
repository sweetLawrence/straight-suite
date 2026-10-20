import { apiRequest, apiRequestPaginated } from '../../lib/apiClient'
import type { Offer } from '../../types/content'

export function listOffers(propertyId?: string) {
  return apiRequestPaginated<Offer>('/admin/offers', { query: { propertyId, pageSize: 100 } }).then((r) => r.data)
}

export interface OfferInput {
  title: string
  description?: string
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  code?: string
}

export function createOffer(input: OfferInput, propertyId?: string) {
  return apiRequest<Offer>('/admin/offers', { method: 'POST', body: input, query: { propertyId } })
}

export function updateOffer(id: string, input: Partial<OfferInput & { isActive: boolean }>, propertyId?: string) {
  return apiRequest<Offer>(`/admin/offers/${id}`, { method: 'PATCH', body: input, query: { propertyId } })
}

export function deleteOffer(id: string, propertyId?: string) {
  return apiRequest(`/admin/offers/${id}`, { method: 'DELETE', query: { propertyId } })
}