import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── Notifications (MD and managers) ────────────────────────────────
export type Severity = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  event_type: string;
  severity: Severity;
  title: string;
  body: string | null;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  property_id: string | null;
  created_at: string;
  read_at: string | null;
  actor?: { id: string; full_name: string } | null;
  property?: { id: string; code: string; name: string } | null;
}

export async function listNotifications(params?: { page?: number; limit?: number; unread?: boolean; severity?: Severity }) {
  const res = await apiClient.get<PaginatedResponse<AppNotification>>('/notifications', {
    params: { ...params, unread: params?.unread ? 'true' : undefined },
  });
  return res.data;
}

export async function getUnreadCount() {
  const res = await apiClient.get<ApiResponse<{ unread: number; critical: number }>>('/notifications/unread-count');
  return res.data.data;
}

export async function markNotificationRead(id: string) {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  const res = await apiClient.post<ApiResponse<{ marked: number }>>('/notifications/read-all');
  return res.data.data;
}

// ─── Approvals inbox (managers) ─────────────────────────────────────
export type ApprovalKind = 'bar_order' | 'transfer' | 'adjustment' | 'stock_take' | 'signed_bill' | 'petty_cash' | 'waste';

export interface ApprovalItem {
  kind: ApprovalKind;
  id: string;
  ref: string;
  title: string;
  detail: string;
  amount: number | null;
  property: string | null;
  requested_by: string | null;
  created_at: string;
  link: string;
}

export interface Approvals {
  items: ApprovalItem[];
  counts: { total: number; bar_order: number; transfer: number; adjustment: number; stock_take: number; signed_bill?: number; petty_cash?: number; waste?: number };
}

export async function getApprovals() {
  const res = await apiClient.get<ApiResponse<Approvals>>('/approvals');
  return res.data.data;
}

/** Approve or reject through each feature's own endpoint */
export async function decideApproval(item: ApprovalItem, decision: 'approve' | 'reject', notes?: string) {
  if (item.kind === 'waste') {
    return apiClient.post(`/waste/${item.id}/decide`, { decision, note: notes || null });
  }
  if (item.kind === 'signed_bill') {
    return apiClient.post(`/payment-lines/${item.id}/decide-signed`, { decision, note: notes || null });
  }
  if (item.kind === 'petty_cash') {
    return decision === 'approve'
      ? apiClient.post(`/petty-cash/${item.id}/authorise`)
      : apiClient.post(`/petty-cash/${item.id}/reject`, { note: notes });
  }
  if (item.kind === 'bar_order') {
    return decision === 'approve'
      ? apiClient.post(`/orders/${item.id}/approve-bar`)
      : apiClient.post(`/orders/${item.id}/reject-bar`, { notes });
  }
  if (item.kind === 'stock_take') {
    return apiClient.post(`/stock-takes/${item.id}/decide`, { decision, notes: notes || null });
  }
  if (item.kind === 'transfer') {
    return apiClient.post(`/transfers/${item.id}/${decision}`, { notes: notes || null });
  }
  return apiClient.post(`/adjustments/${item.id}/decide`, {
    decision: decision === 'approve' ? 'approved' : 'rejected',
    notes: notes || null,
  });
}
