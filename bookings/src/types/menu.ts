export interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  sortOrder: number
  isActive: boolean
}

export interface MenuCategory {
  id: string
  propertyId: string
  name: string
  sortOrder: number
  isActive: boolean
  items: MenuItem[]
}