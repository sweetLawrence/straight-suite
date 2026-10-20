export interface Offer {
  id: string
  propertyId: string
  title: string
  description: string | null
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  code: string | null
  validFrom: string | null
  validTo: string | null
  imageUrl: string | null
  terms: string | null
  isActive: boolean
}

export interface EventType {
  id: string
  propertyId: string
  title: string
  description: string | null
  imageUrl: string | null
  icon: string | null
  capacity: string | null
  slug: string | null
  sortOrder: number
  isActive: boolean
}

export type GalleryCategory = 'rooms' | 'dining' | 'events' | 'exterior'

export interface GalleryItem {
  id: string
  propertyId: string
  category: GalleryCategory
  imageUrl: string
  caption: string | null
  sortOrder: number
}

export const GALLERY_CATEGORIES: GalleryCategory[] = ['rooms', 'dining', 'events', 'exterior']