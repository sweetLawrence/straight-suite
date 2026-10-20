import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useOpenHandoffs() {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['whatsappHandoffs', propertyId],
    queryFn: () => api.listOpenHandoffs(propertyId),
    refetchInterval: 20000 // new handoffs shouldn't need a manual refresh to notice
  })
}

export function useResolveHandoff() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.resolveHandoff(id, propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsappHandoffs'] })
  })
}