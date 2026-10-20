import { apiRequest } from '../../lib/apiClient'
import type { GalleryItem } from '../../types/content'

export function listGallery(propertyId?: string, category?: string) {
  return apiRequest<GalleryItem[]>('/admin/gallery', { query: { propertyId, category } })
}

export function uploadMedia(file: File, propertyId?: string) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest<{ id: string; url: string }>('/admin/media/upload', {
    method: 'POST', body: formData, isForm: true, query: { propertyId }
  })
}

export interface GalleryItemInput {
  category: string
  imageUrl: string
  caption?: string
}

export function createGalleryItem(input: GalleryItemInput, propertyId?: string) {
  return apiRequest<GalleryItem>('/admin/gallery', { method: 'POST', body: input, query: { propertyId } })
}

export function deleteGalleryItem(id: string, propertyId?: string) {
  return apiRequest(`/admin/gallery/${id}`, { method: 'DELETE', query: { propertyId } })
}

export function reorderGallery(items: { id: string; sortOrder: number }[], propertyId?: string) {
  return apiRequest('/admin/gallery/reorder', { method: 'PATCH', body: { items }, query: { propertyId } })
}