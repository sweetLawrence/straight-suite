import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useMenuCategories() {
  const { propertyId } = useAdminScope()
  return useQuery({ queryKey: ['menuCategories', propertyId], queryFn: () => api.listCategories(propertyId) })
}

function useInvalidateMenu() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['menuCategories'] })
}

export function useCreateCategory() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: ({ name, sortOrder }: { name: string; sortOrder: number }) => api.createCategory(name, sortOrder, propertyId),
    onSuccess: invalidate
  })
}

export function useUpdateCategory() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; isActive?: boolean } }) => api.updateCategory(id, input, propertyId),
    onSuccess: invalidate
  })
}

export function useReorderCategories() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => api.reorderCategories(items, propertyId),
    onSuccess: invalidate
  })
}

export function useCreateItem() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: api.MenuItemInput }) => api.createItem(categoryId, input, propertyId),
    onSuccess: invalidate
  })
}

export function useUpdateItem() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: ({ categoryId, itemId, input }: { categoryId: string; itemId: string; input: Partial<api.MenuItemInput & { isActive: boolean }> }) =>
      api.updateItem(categoryId, itemId, input, propertyId),
    onSuccess: invalidate
  })
}

export function useReorderItems() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: ({ categoryId, items }: { categoryId: string; items: { id: string; sortOrder: number }[] }) =>
      api.reorderItems(categoryId, items, propertyId),
    onSuccess: invalidate
  })

}




export function usePermanentlyDeleteCategory() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: (id: string) => api.permanentlyDeleteCategory(id, propertyId),
    onSuccess: invalidate
  })
}

export function usePermanentlyDeleteItem() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateMenu()
  return useMutation({
    mutationFn: ({ categoryId, itemId }: { categoryId: string; itemId: string }) =>
      api.permanentlyDeleteItem(categoryId, itemId, propertyId),
    onSuccess: invalidate
  })
}