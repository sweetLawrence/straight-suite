export type RoomStatus = 'active' | 'maintenance' | 'out_of_service'

export interface Room {
  id: string
  propertyId: string
  roomTypeId: string
  roomNumber: string
  floor: string | null
  status: RoomStatus
}

export const ROOM_STATUSES: RoomStatus[] = ['active', 'maintenance', 'out_of_service']