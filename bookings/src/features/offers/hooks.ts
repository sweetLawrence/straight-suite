import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useOffers() {
  const { propertyId } = useAdminScope()
  return useQuery({ queryKey: ['offers', propertyId], queryFn: () => api.listOffers(propertyId) })
}

function useInvalidateOffers() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['offers'] })
}

export function useCreateOffer() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateOffers()
  return useMutation({ mutationFn: (input: api.OfferInput) => api.createOffer(input, propertyId), onSuccess: invalidate })
}

export function useUpdateOffer() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateOffers()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.OfferInput & { isActive: boolean }> }) =>
      api.updateOffer(id, input, propertyId),
    onSuccess: invalidate
  })
}

export function useDeleteOffer() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateOffers()
  return useMutation({ mutationFn: (id: string) => api.deleteOffer(id, propertyId), onSuccess: invalidate })
}