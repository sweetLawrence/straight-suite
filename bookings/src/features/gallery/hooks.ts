import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useGallery(category?: string) {
  const { propertyId } = useAdminScope()
  return useQuery({ queryKey: ['gallery', propertyId, category], queryFn: () => api.listGallery(propertyId, category) })
}

function useInvalidateGallery() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['gallery'] })
}

export function useUploadGalleryImage() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateGallery()
  return useMutation({
    mutationFn: async ({ file, category, caption }: { file: File; category: string; caption?: string }) => {
      const uploaded = await api.uploadMedia(file, propertyId)
      return api.createGalleryItem({ category, imageUrl: uploaded.url, caption }, propertyId)
    },
    onSuccess: invalidate
  })
}

export function useDeleteGalleryItem() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateGallery()
  return useMutation({ mutationFn: (id: string) => api.deleteGalleryItem(id, propertyId), onSuccess: invalidate })
}

export function useReorderGallery() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateGallery()
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => api.reorderGallery(items, propertyId),
    onSuccess: invalidate
  })
}