export interface CancellationTier {
  days_before?: number
  hours_before?: number
  refund_pct: number
}

export interface CancellationPolicy {
  id: string
  propertyId: string
  name: string
  tiers: CancellationTier[]
  depositPct: number
  isDefault: boolean
}