import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useRatePlans() {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['ratePlans', propertyId],
    queryFn: () => api.listRatePlans(propertyId)
  })
}

function useInvalidateRatePlans() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['ratePlans'] })
}

export function useCreateRatePlan() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRatePlans()
  return useMutation({
    mutationFn: (input: api.RatePlanInput) => api.createRatePlan(input, propertyId),
    onSuccess: invalidate
  })
}

export function useUpdateRatePlan() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRatePlans()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.RatePlanInput & { isActive: boolean }> }) =>
      api.updateRatePlan(id, input, propertyId),
    onSuccess: invalidate
  })
}

export function useDeleteRatePlan() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRatePlans()
  return useMutation({
    mutationFn: (id: string) => api.deleteRatePlan(id, propertyId),
    onSuccess: invalidate
  })
}