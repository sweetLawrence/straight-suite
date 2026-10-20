import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function usePropertySettings() {
  const { propertyId } = useAdminScope()
  return useQuery({ queryKey: ['propertySettings', propertyId], queryFn: () => api.getProperty(propertyId) })
}

export function useUpdatePropertySettings() {
  const { propertyId } = useAdminScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: api.PropertyUpdateInput) => api.updateProperty(input, propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propertySettings'] })
  })
}