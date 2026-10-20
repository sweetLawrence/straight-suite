import { apiRequest, apiRequestPaginated } from '../../lib/apiClient'
import type { RoomType } from '../../types/roomType'

export function listRoomTypes(propertyId?: string) {
  return apiRequestPaginated<RoomType>('/admin/room-types', {
    query: { propertyId, pageSize: 100 }
  }).then((res) => res.data)
}

export function getRoomType(id: string, propertyId?: string) {
  return apiRequest<RoomType>(`/admin/room-types/${id}`, { query: { propertyId } })
}

// export interface RoomTypeInput {
//   slug: string
//   name: string
//   description?: string
//   bedType?: string
//   bedConfiguration?: string
//   maxAdults: number
//   maxChildren: number
//   totalUnits: number
//   basePrice: number
// }

export interface RoomTypeInput {
  name: string
  description?: string
  bedType?: string
  bedConfiguration?: string
  maxAdults: number
  maxChildren: number
  totalUnits: number
  basePrice: number
}

export function createRoomType(input: RoomTypeInput, propertyId?: string) {
  return apiRequest<RoomType>('/admin/room-types', { method: 'POST', body: input, query: { propertyId } })
}

export function updateRoomType(id: string, input: Partial<RoomTypeInput & { isActive: boolean }>, propertyId?: string) {
  return apiRequest<RoomType>(`/admin/room-types/${id}`, { method: 'PATCH', body: input, query: { propertyId } })
}

export function deactivateRoomType(id: string, propertyId?: string) {
  return apiRequest(`/admin/room-types/${id}`, { method: 'DELETE', query: { propertyId } })
}

export function uploadMedia(file: File, propertyId?: string) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest<{ id: string; url: string }>('/admin/media/upload', {
    method: 'POST', body: formData, isForm: true, query: { propertyId }
  })
}

export function addRoomTypeImage(roomTypeId: string, url: string, isCover: boolean, propertyId?: string) {
  return apiRequest(`/admin/room-types/${roomTypeId}/images`, {
    method: 'POST', body: { url, isCover }, query: { propertyId }
  })
}

export function setRoomTypeImageCover(roomTypeId: string, imageId: string, propertyId?: string) {
  return apiRequest(`/admin/room-types/${roomTypeId}/images/${imageId}`, {
    method: 'PATCH', body: { isCover: true }, query: { propertyId }
  })
}

export function deleteRoomTypeImage(roomTypeId: string, imageId: string, propertyId?: string) {
  return apiRequest(`/admin/room-types/${roomTypeId}/images/${imageId}`, { method: 'DELETE', query: { propertyId } })
}