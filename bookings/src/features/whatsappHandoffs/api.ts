import { apiRequest } from '../../lib/apiClient'
import type { WhatsappHandoff } from '../../types/whatsappHandoff'

export function listOpenHandoffs(propertyId?: string) {
  return apiRequest<WhatsappHandoff[]>('/admin/whatsapp-handoffs', { query: { propertyId } })
}

export function resolveHandoff(id: string, propertyId?: string) {
  return apiRequest<WhatsappHandoff>(`/admin/whatsapp-handoffs/${id}/resolve`, { method: 'PATCH', query: { propertyId } })
}