import { apiRequest } from '../../lib/apiClient'
import type { PropertySettings } from '../../types/property'

export function getProperty(propertyId?: string) {
  return apiRequest<PropertySettings>('/admin/property', { query: { propertyId } })
}

export interface PropertyUpdateInput {
  contactEmail?: string
  contactPhone?: string
  address?: string
  checkInTime?: string
  checkOutTime?: string
}

export function updateProperty(input: PropertyUpdateInput, propertyId?: string) {
  return apiRequest<PropertySettings>('/admin/property', { method: 'PATCH', body: input, query: { propertyId } })
}