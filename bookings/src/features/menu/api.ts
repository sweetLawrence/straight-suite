import { apiRequest } from '../../lib/apiClient'
import type { MenuCategory } from '../../types/menu'

export function listCategories(propertyId?: string) {
  return apiRequest<MenuCategory[]>('/admin/menu-categories', { query: { propertyId } })
}

export function createCategory(name: string, sortOrder: number, propertyId?: string) {
  return apiRequest<MenuCategory>('/admin/menu-categories', { method: 'POST', body: { name, sortOrder }, query: { propertyId } })
}

export function updateCategory(id: string, input: { name?: string; isActive?: boolean }, propertyId?: string) {
  return apiRequest<MenuCategory>(`/admin/menu-categories/${id}`, { method: 'PATCH', body: input, query: { propertyId } })
}

export function reorderCategories(items: { id: string; sortOrder: number }[], propertyId?: string) {
  return apiRequest('/admin/menu-categories/reorder', { method: 'PATCH', body: { items }, query: { propertyId } })
}

export interface MenuItemInput {
  name: string
  description?: string
  price: number
  sortOrder?: number
}

export function createItem(categoryId: string, input: MenuItemInput, propertyId?: string) {
  return apiRequest(`/admin/menu-categories/${categoryId}/items`, { method: 'POST', body: input, query: { propertyId } })
}

export function updateItem(categoryId: string, itemId: string, input: Partial<MenuItemInput & { isActive: boolean }>, propertyId?: string) {
  return apiRequest(`/admin/menu-categories/${categoryId}/items/${itemId}`, { method: 'PATCH', body: input, query: { propertyId } })
}

export function reorderItems(categoryId: string, items: { id: string; sortOrder: number }[], propertyId?: string) {
  return apiRequest(`/admin/menu-categories/${categoryId}/items/reorder`, { method: 'PATCH', body: { items }, query: { propertyId } })
}


export function permanentlyDeleteCategory(id: string, propertyId?: string) {
  return apiRequest(`/admin/menu-categories/${id}/permanent`, { method: 'DELETE', query: { propertyId } })
}

export function permanentlyDeleteItem(categoryId: string, itemId: string, propertyId?: string) {
  return apiRequest(`/admin/menu-categories/${categoryId}/items/${itemId}/permanent`, { method: 'DELETE', query: { propertyId } })
}