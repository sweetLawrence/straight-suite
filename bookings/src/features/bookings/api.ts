import { apiRequest, apiRequestPaginated } from '../../lib/apiClient'
import type { Booking, Payment, Refund, BookingStatus } from '../../types/booking'

export interface BookingFilters {
  status?: string
  search?: string
  from?: string
  to?: string
  roomNumber?: string
  page?: number
  pageSize?: number
}

export function listBookings(filters: BookingFilters, propertyId?: string) {
  return apiRequestPaginated<Booking>('/admin/bookings', {
    query: { ...filters, propertyId }
  })
}

export function getBooking(id: string, propertyId?: string) {
  return apiRequest<Booking>(`/admin/bookings/${id}`, { query: { propertyId } })
}

export function updateBookingStatus(id: string, status: BookingStatus, propertyId?: string) {
  return apiRequest<Booking>(`/admin/bookings/${id}/status`, {
    method: 'PATCH', body: { status }, query: { propertyId }
  })
}

export function assignRoom(bookingId: string, roomId: string, propertyId?: string) {
  return apiRequest(`/admin/bookings/${bookingId}/assign-room`, {
    method: 'POST', body: { roomId }, query: { propertyId }
  })
}

export interface ManualBookingInput {
  roomTypeId: string
  ratePlanId?: string | null
  checkInDate: string
  checkOutDate: string
  numAdults?: number
  numChildren?: number
  numChildrenUnder4?: number
  numRooms?: number
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  guestPhone?: string
  specialRequests?: string
  paymentCollected: 'none' | 'cash' | 'mpesa'
}

export function createManualBooking(input: ManualBookingInput, propertyId?: string) {
  return apiRequest<Booking>('/admin/bookings/manual', {
    method: 'POST', body: input, query: { propertyId }
  })
}

export function listPayments(bookingId: string, propertyId?: string) {
  return apiRequest<Payment[]>('/admin/payments', { query: { bookingId, propertyId } })
}

export function requestRefund(paymentId: string, amount: number, reason: string, propertyId?: string) {
  return apiRequest<Refund>(`/admin/payments/${paymentId}/refund`, {
    method: 'POST', body: { amount, reason }, query: { propertyId }
  })
}

export function updateRefundStatus(refundId: string, status: string, propertyId?: string) {
  return apiRequest<Refund>(`/admin/refunds/${refundId}/status`, {
    method: 'PATCH', body: { status }, query: { propertyId }
  })
}

