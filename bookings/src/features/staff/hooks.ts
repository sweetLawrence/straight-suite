import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

export function useStaff(propertyId?: string) {
  return useQuery({ queryKey: ['staff', propertyId], queryFn: () => api.listStaff(propertyId) })
}

export function usePendingApplicants() {
  return useQuery({ queryKey: ['pendingApplicants'], queryFn: api.listPendingApplicants })
}

function useInvalidateStaff() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['staff'] })
    qc.invalidateQueries({ queryKey: ['pendingApplicants'] })
  }
}

export function useCreateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({ mutationFn: (input: api.CreateStaffInput) => api.createStaff(input), onSuccess: invalidate })
}

export function useUpdateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ role: string; propertyId: string; isActive: boolean }> }) =>
      api.updateStaff(id, input),
    onSuccess: invalidate
  })
}

export function useDeactivateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({ mutationFn: (id: string) => api.deactivateStaff(id), onSuccess: invalidate })
}

export function useInvitePendingApplicant() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: ({ id, propertyId, role }: { id: string; propertyId: string; role: 'staff' | 'admin' }) =>
      api.invitePendingApplicant(id, propertyId, role),
    onSuccess: invalidate
  })
}

export function useRejectPendingApplicant() {
  const invalidate = useInvalidateStaff()
  return useMutation({ mutationFn: (id: string) => api.rejectPendingApplicant(id), onSuccess: invalidate })
}