import { useQuery } from '@tanstack/react-query'
import {
  listProperties,
  listUsers,
  getCurrentBusinessDay,
  getCurrentShift,
  listRoles,
  listTransferTargets,
  listPermissions,

  createUser,
  updateUser,
  assignUserRole,
  revokeUserRole,
  updateProperty
} from '@/lib/api/core'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listMenuItems, listUnits } from '@/lib/api/menu'

export function useProperties (page = 1, limit = 20) {
  return useQuery({
    queryKey: ['properties', page, limit],
    queryFn: () => listProperties({ page, limit })
  })
}

export function useUsers (page = 1, limit = 20, role?: string) {
  return useQuery({
    queryKey: ['users', page, limit, role],
    queryFn: () => listUsers({ page, limit, role })
  })
}

export function useCurrentBusinessDay (enabled = true) {
  return useQuery({
    queryKey: ['business-day', 'current'],
    queryFn: getCurrentBusinessDay,
    retry: false, // 404 if none is open - don't retry
    enabled
  })
}

export function useCurrentShift (enabled = true) {
  return useQuery({
    queryKey: ['shift', 'current'],
    queryFn: getCurrentShift,
    retry: false,
    enabled
  })
}

export function useRoles () {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles()
  })
}

export function usePermissions () {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => listPermissions()
  })
}

export function useMenuItems (page = 1, limit = 20, category?: string, extra?: { status?: string; station?: string }) {
  return useQuery({
    queryKey: ['menu-items', page, limit, category, extra?.status, extra?.station],
    queryFn: () => listMenuItems({ page, limit, category, ...extra }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30000
  })
}

export function useUnits () {
  return useQuery({
    queryKey: ['units'],
    queryFn: () => listUnits({ limit: 100 })
  })
}

export function useTransferTargets () {
  return useQuery({
    queryKey: ['transfer-targets'],
    queryFn: listTransferTargets
  })
}



export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateUser>[1];
    }) => updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { role_code: string; property_id?: string };
    }) => assignUserRole(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRevokeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      revokeUserRole(userId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateProperty>[1];
    }) => updateProperty(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}