import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useEventTypes() {
  const { propertyId } = useAdminScope()
  return useQuery({ queryKey: ['eventTypes', propertyId], queryFn: () => api.listEventTypes(propertyId) })
}

function useInvalidateEventTypes() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['eventTypes'] })
}

export function useCreateEventType() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateEventTypes()
  return useMutation({ mutationFn: (input: api.EventTypeInput) => api.createEventType(input, propertyId), onSuccess: invalidate })
}

export function useDeleteEventType() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateEventTypes()
  return useMutation({ mutationFn: (id: string) => api.deleteEventType(id, propertyId), onSuccess: invalidate })
}

export function useReorderEventTypes() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateEventTypes()
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => api.reorderEventTypes(items, propertyId),
    onSuccess: invalidate
  })
}

export function useUploadEventTypeImage() {
  const { propertyId } = useAdminScope()
  return useMutation({ mutationFn: (file: File) => api.uploadMedia(file, propertyId) })
}