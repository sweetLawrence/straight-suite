// import { apiRequest } from '../../lib/apiClient'
// import type { EventType } from '../../types/content'

// export function listEventTypes(propertyId?: string) {
//   return apiRequest<EventType[]>('/admin/event-types', { query: { propertyId } })
// }

// export interface EventTypeInput {
//   title: string
//   description?: string
//   icon?: string
//   capacity?: string
//   slug?: string
//   sortOrder: number
// }

// export function createEventType(input: EventTypeInput, propertyId?: string) {
//   return apiRequest<EventType>('/admin/event-types', { method: 'POST', body: input, query: { propertyId } })
// }

// export function updateEventType(id: string, input: Partial<EventTypeInput & { isActive: boolean }>, propertyId?: string) {
//   return apiRequest<EventType>(`/admin/event-types/${id}`, { method: 'PATCH', body: input, query: { propertyId } })
// }

// export function deleteEventType(id: string, propertyId?: string) {
//   return apiRequest(`/admin/event-types/${id}`, { method: 'DELETE', query: { propertyId } })
// }

// export function reorderEventTypes(items: { id: string; sortOrder: number }[], propertyId?: string) {
//   return apiRequest('/admin/event-types/reorder', { method: 'PATCH', body: { items }, query: { propertyId } })
// }



















import { apiRequest } from '../../lib/apiClient'
import type { EventType } from '../../types/content'

export function listEventTypes(propertyId?: string) {
  return apiRequest<EventType[]>('/admin/event-types', { query: { propertyId } })
}

export interface EventTypeInput {
  title: string
  description?: string
  icon?: string
  capacity?: string
  slug?: string
  imageUrl?: string
  sortOrder: number
}

export function createEventType(input: EventTypeInput, propertyId?: string) {
  return apiRequest<EventType>('/admin/event-types', { method: 'POST', body: input, query: { propertyId } })
}

export function updateEventType(id: string, input: Partial<EventTypeInput & { isActive: boolean }>, propertyId?: string) {
  return apiRequest<EventType>(`/admin/event-types/${id}`, { method: 'PATCH', body: input, query: { propertyId } })
}

export function deleteEventType(id: string, propertyId?: string) {
  return apiRequest(`/admin/event-types/${id}`, { method: 'DELETE', query: { propertyId } })
}

export function reorderEventTypes(items: { id: string; sortOrder: number }[], propertyId?: string) {
  return apiRequest('/admin/event-types/reorder', { method: 'PATCH', body: { items }, query: { propertyId } })
}

export function uploadMedia(file: File, propertyId?: string) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest<{ id: string; url: string }>('/admin/media/upload', {
    method: 'POST', body: formData, isForm: true, query: { propertyId }
  })
}