
import { apiRequest } from '../../lib/apiClient'
import type { AdminPayment } from '../../types/payment'

export function initiateStkPush(bookingCode: string, phoneNumber: string, amountType: 'deposit' | 'balance' | 'full') {
  return apiRequest<{ status: string; providerReference: string }>('/payments/mpesa/stkpush', {
    method: 'POST',
    body: { bookingCode, phoneNumber, amountType },
    auth: false
  })
}

export interface PaymentStatusResult {
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'reversed'
  bookingStatus: string
  amount: number
  mpesaReceiptNumber: string | null
}

export function getPaymentStatus(bookingCode: string) {
  return apiRequest<PaymentStatusResult>(`/payments/${bookingCode}/status`, { auth: false })
}

export function listAdminPayments(propertyId?: string, isManual?: boolean, status?: string) {
  return apiRequest<AdminPayment[]>('/admin/payments', { 
    query: { 
      propertyId, 
      isManual: isManual !== undefined ? String(isManual) : undefined, 
      status 
    } 
  })
}

export function verifyManualPayment(paymentId: string, action: 'confirm' | 'reject', propertyId?: string) {
  return apiRequest<{ status: string }>(`/admin/payments/${paymentId}/verify-manual`, {
    method: 'PATCH', body: { action }, query: { propertyId }
  })
}

export function recordCashPayment(bookingId: string, amount: number, type: 'deposit' | 'balance' | 'full', propertyId?: string) {
  return apiRequest(`/admin/bookings/${bookingId}/record-payment`, {
    method: 'POST', body: { amount, type }, query: { propertyId }
  })
}

export function listUnmatchedPayments(propertyId?: string) {
  return apiRequest<AdminPayment[]>('/admin/payments/unmatched', { query: { propertyId } })
}

export function assignUnmatchedPayment(paymentId: string, bookingId: string, propertyId?: string) {
  return apiRequest<AdminPayment>(`/admin/payments/unmatched/${paymentId}/assign`, {
    method: 'POST', body: { bookingId }, query: { propertyId }
  })
}

export function registerC2bUrls(baseUrl: string) {
  return apiRequest<{ ResponseCode: string; ResponseDescription: string }>('/admin/mpesa/register-c2b-urls', {
    method: 'POST', body: { baseUrl }
  })
}