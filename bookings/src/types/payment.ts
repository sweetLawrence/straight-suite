export interface AdminPayment {
  id: string
  bookingId: string
  provider: string
  type: string
  amount: number
  currency: string
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'reversed'
  isManual: boolean
  providerReference: string | null
  mpesaReceiptNumber: string | null
  phoneNumber: string | null
}