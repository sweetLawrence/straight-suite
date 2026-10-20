import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApprovalItem,
  decideApproval,
  getApprovals,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  Severity,
} from '@/lib/api/notifications';

export function useNotifications(params: { page?: number; limit?: number; unread?: boolean; severity?: Severity }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => listNotifications(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    enabled,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useApprovals(enabled = true) {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: getApprovals,
    refetchInterval: 30_000,
    enabled,
  });
}

export function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { item: ApprovalItem; decision: 'approve' | 'reject'; notes?: string }) =>
      decideApproval(v.item, v.decision, v.notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['adjustments'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['petty-cash'] });
      qc.invalidateQueries({ queryKey: ['waste'] });
      qc.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}
