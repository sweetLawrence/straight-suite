import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useInitiateStkPush() {
  return useMutation({
    mutationFn: ({ bookingCode, phoneNumber, amountType }: { bookingCode: string; phoneNumber: string; amountType: 'deposit' | 'balance' | 'full' }) =>
      api.initiateStkPush(bookingCode, phoneNumber, amountType)
  })
}

const RESOLVED_STATUSES = ['completed', 'failed', 'reversed']

export function usePaymentStatusPoll(bookingCode: string | null, enabled: boolean) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ['paymentStatus', bookingCode],
    queryFn: () => api.getPaymentStatus(bookingCode as string),
    enabled: enabled && !!bookingCode,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && RESOLVED_STATUSES.includes(status)) {
        if (status === 'completed') {
          qc.invalidateQueries({ queryKey: ['bookings'] })
          qc.invalidateQueries({ queryKey: ['booking'] })
        }
        return false
      }
      return 3000
    }
  })
}

export function usePendingManualPayments() {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['pendingManualPayments', propertyId],
    queryFn: () => api.listAdminPayments(propertyId, true, 'pending')
  })
}

export function usePendingManualPaymentsCount() {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['pendingManualPaymentsCount', propertyId],
    queryFn: () => api.listAdminPayments(propertyId, true, 'pending'),
    select: (data) => data.length,
    refetchInterval: 30000
  })
}

export function useVerifyManualPayment() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, action }: { paymentId: string; action: 'confirm' | 'reject' }) =>
      api.verifyManualPayment(paymentId, action, propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingManualPayments'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    }
  })
}

export function useRecordCashPayment() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, amount, type }: { bookingId: string; amount: number; type: 'deposit' | 'balance' | 'full' }) =>
      api.recordCashPayment(bookingId, amount, type, propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    }
  })
}

export function useUnmatchedPayments() {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['unmatchedPayments', propertyId],
    queryFn: () => api.listUnmatchedPayments(propertyId)
  })
}

export function useAssignUnmatchedPayment() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, bookingId }: { paymentId: string; bookingId: string }) =>
      api.assignUnmatchedPayment(paymentId, bookingId, propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unmatchedPayments'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    }
  })
}

export function useRegisterC2bUrls() {
  return useMutation({ mutationFn: (baseUrl: string) => api.registerC2bUrls(baseUrl) })
}