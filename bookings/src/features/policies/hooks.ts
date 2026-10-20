import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function usePolicies() {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['policies', propertyId],
    queryFn: () => api.listPolicies(propertyId)
  })
}

function useInvalidatePolicies() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['policies'] })
}

export function useCreatePolicy() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidatePolicies()
  return useMutation({
    mutationFn: (input: api.PolicyInput) => api.createPolicy(input, propertyId),
    onSuccess: invalidate
  })
}

export function useUpdatePolicy() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidatePolicies()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.PolicyInput> }) =>
      api.updatePolicy(id, input, propertyId),
    onSuccess: invalidate
  })
}

export function useDeletePolicy() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidatePolicies()
  return useMutation({
    mutationFn: (id: string) => api.deletePolicy(id, propertyId),
    onSuccess: invalidate
  })
}

export function useSetDefaultPolicy() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidatePolicies()
  return useMutation({
    mutationFn: (id: string) => api.setDefaultPolicy(id, propertyId),
    onSuccess: invalidate
  })
}