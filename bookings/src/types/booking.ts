export type BookingStatus =
  | 'pending_payment' | 'confirmed' | 'checked_in' | 'checked_out'
  | 'cancelled' | 'no_show' | 'expired'

export interface Booking {
  id: string
  bookingCode: string
  propertyId: string
  roomTypeId: string
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  guestPhone: string | null
  checkInDate: string
  checkOutDate: string
  numAdults: number
  numChildren: number
  numChildrenUnder4?: number
  numRooms: number
  specialRequests: string | null
  status: BookingStatus
  subtotal: number
  depositRequired: number
  amountPaid: number
  balanceDue: number
  currency: string
  cancellationDeadlineAt: string | null
  expiresAt: string | null
  roomNumbers: string[]
}

export interface Payment {
  id: string
  bookingId: string
  provider: 'mpesa' | 'cash' | 'card'
  type: 'deposit' | 'balance' | 'full'
  amount: number
  currency: string
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'reversed'
  providerReference: string | null
  mpesaReceiptNumber: string | null
  phoneNumber: string | null
}

export interface Refund {
  id: string
  bookingId: string
  paymentId: string
  amount: number
  reason: string
  status: 'requested' | 'processing' | 'completed' | 'rejected'
}

export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  no_show: [],
  expired: []
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending_payment: 'yellow',
  confirmed: 'green',
  checked_in: 'blue',
  checked_out: 'gray',
  cancelled: 'red',
  no_show: 'red',
  expired: 'gray'
} 