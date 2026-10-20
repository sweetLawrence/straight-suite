export interface OccupancyRow {
  roomTypeId: string
  roomTypeName: string
  bookedRoomNights: number
  availableRoomNights: number
  occupancyPct: number
}

export interface RevenueRow {
  roomTypeId: string
  roomTypeName: string
  bookedRevenue: number
  collectedRevenue: number
  outstandingRevenue: number
}