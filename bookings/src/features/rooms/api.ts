import { apiRequest } from '../../lib/apiClient'
import type { Room, RoomStatus } from '../../types/room'

export function listRooms(propertyId?: string, roomTypeId?: string, status?: string) {
  return apiRequest<Room[]>('/admin/rooms', { query: { propertyId, roomTypeId, status } })
}

export interface RoomInput {
  roomTypeId: string
  roomNumber: string
  floor?: string
}

export function createRoom(input: RoomInput, propertyId?: string) {
  return apiRequest<Room>('/admin/rooms', { method: 'POST', body: input, query: { propertyId } })
}

export function updateRoom(id: string, input: Partial<RoomInput>, propertyId?: string) {
  return apiRequest<Room>(`/admin/rooms/${id}`, { method: 'PATCH', body: input, query: { propertyId } })
}

export function updateRoomStatus(id: string, status: RoomStatus, propertyId?: string) {
  return apiRequest<Room>(`/admin/rooms/${id}/status`, { method: 'PATCH', body: { status }, query: { propertyId } })
}

export function deleteRoom(id: string, propertyId?: string) {
  return apiRequest(`/admin/rooms/${id}`, { method: 'DELETE', query: { propertyId } })
}