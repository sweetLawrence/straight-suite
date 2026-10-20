export interface RatePlan {
  id: string
  propertyId: string
  roomTypeId: string
  name: string
  priceOverride: number
  cancellationPolicyId: string | null
  validFrom: string
  validTo: string
  isActive: boolean
  boardType: 'bb' | 'hb' | 'fb' | null
}