export type BedType = 'single' | 'twin' | 'double' | 'queen' | 'king' | 'bunk'

export interface RoomTypeImage {
  id: string
  url: string
  altText: string | null
  sortOrder: number
  isCover: boolean
}

export interface RoomType {
  id: string
  propertyId: string
  slug: string
  name: string
  description: string | null
  sizeSqm: number | null
  bedType: BedType | null
  bedConfiguration: string | null
  maxAdults: number
  maxChildren: number
  totalUnits: number
  basePrice: number
  currency: string
  attributes: Record<string, unknown>
  isActive: boolean
  images: RoomTypeImage[]
}

export const BED_TYPES: BedType[] = ['single', 'twin', 'double', 'queen', 'king', 'bunk']