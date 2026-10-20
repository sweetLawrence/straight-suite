import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'
import type { BookingStatus } from '../../types/booking'

export function useBookings(filters: api.BookingFilters) {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['bookings', propertyId, filters],
    queryFn: () => api.listBookings(filters, propertyId)
  })
}

export function useBooking(id: string | null) {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['booking', propertyId, id],
    queryFn: () => api.getBooking(id as string, propertyId),
    enabled: !!id
  })
}

export function usePayments(bookingId: string | null) {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['payments', propertyId, bookingId],
    queryFn: () => api.listPayments(bookingId as string, propertyId),
    enabled: !!bookingId
  })
}

export function useUpdateBookingStatus() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      api.updateBookingStatus(id, status, propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.invalidateQueries({ queryKey: ['booking'] })
    }
  })
}

export function useAssignRoom() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, roomId }: { bookingId: string; roomId: string }) =>
      api.assignRoom(bookingId, roomId, propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking'] })
  })
}

export function useCreateManualBooking() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: api.ManualBookingInput) => api.createManualBooking(input, propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] })
  })
}

export function useRequestRefund() {
  const { propertyId } = useAdminScope()
  return useMutation({
    mutationFn: ({ paymentId, amount, reason }: { paymentId: string; amount: number; reason: string }) =>
      api.requestRefund(paymentId, amount, reason, propertyId)
  })
}

export function useUpdateRefundStatus() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ refundId, status }: { refundId: string; status: string }) =>
      api.updateRefundStatus(refundId, status, propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] })
  })
}

export function useOverdueArrivals() {
  const { propertyId } = useAdminScope()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  return useQuery({
    queryKey: ['overdueArrivals', propertyId, yesterday],
    queryFn: () => api.listBookings({ status: 'confirmed', to: yesterday, pageSize: 50 }, propertyId)
  })
}