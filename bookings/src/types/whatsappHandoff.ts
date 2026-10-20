export interface WhatsappHandoff {
  id: string
  propertyId: string
  waId: string
  reason: string
  status: 'open' | 'resolved'
  conversationSnapshot: Array<{ role: string; content: string | null }>
  createdAt: string
}