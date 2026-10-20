import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── ADJUSTMENTS ────────────────────────────────────────────────────
export interface Adjustment {
  id: string;
  adjustment_ref: string;
  property_id: string;
  adjustment_type:
    | 'stock_correction'
    | 'cash_correction'
    | 'bill_correction'
    | 'payment_correction';
  original_entity_type: string;
  original_entity_id: string;
  adjustment_entity_type: string | null;
  adjustment_entity_id: string | null;
  amount: string | null;
  reason: string;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'posted';
  created_at: string;
  requested_by_user?: { id: string; full_name: string };
  approved_by_user?: { id: string; full_name: string };
  property?: { id: string; code: string; name: string };
}

export async function listAdjustments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  adjustment_type?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<Adjustment>>(
    '/adjustments',
    { params }
  );
  return res.data;
}

export async function getAdjustment(id: string) {
  const res = await apiClient.get<ApiResponse<Adjustment>>(
    `/adjustments/${id}`
  );
  return res.data.data;
}

export async function createAdjustment(data: {
  adjustment_type:
    | 'stock_correction'
    | 'cash_correction'
    | 'bill_correction'
    | 'payment_correction';
  original_entity_type: string;
  original_entity_id: string;
  amount?: number | null;
  reason: string;
}) {
  const res = await apiClient.post<ApiResponse<Adjustment>>(
    '/adjustments',
    data
  );
  return res.data.data;
}

export async function decideAdjustment(
  id: string,
  data: { decision: 'approved' | 'rejected'; notes?: string }
) {
  const res = await apiClient.post<ApiResponse<Adjustment>>(
    `/adjustments/${id}/decide`,
    data
  );
  return res.data.data;
}

// ─── RECONCILIATION CHECKS ──────────────────────────────────────────
export interface ReconciliationCheck {
  id: string;
  check_ref: string;
  property_id: string;
  business_day_id: string;
  shift_id: string | null;
  check_type: 'customer_bill' | 'waiter_collections' | 'stock_fulfilment';
  reference_type: string | null;
  reference_id: string | null;
  expected_amount: string | null;
  actual_amount: string | null;
  variance: string | null;
  status: 'pending' | 'balanced' | 'exception';
  notes: string | null;
  checked_by: string;
  checked_at: string;
  checked_by_user?: { id: string; full_name: string };
  property?: { id: string; code: string; name: string };
}

export async function listReconciliationChecks(params?: {
  page?: number;
  limit?: number;
  check_type?: string;
  status?: string;
  business_day_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<ReconciliationCheck>>(
    '/reconciliation-checks',
    { params }
  );
  return res.data;
}

export async function getReconciliationCheck(id: string) {
  const res = await apiClient.get<ApiResponse<ReconciliationCheck>>(
    `/reconciliation-checks/${id}`
  );
  return res.data.data;
}

export async function runReconciliation(data: {
  check_type: 'customer_bill' | 'waiter_collections' | 'stock_fulfilment';
  property_id?: string;
  business_day_id?: string;
  shift_id?: string;
}) {
  const res = await apiClient.post<
    ApiResponse<{
      check_type: string;
      business_day_id: string;
      shift_id: string;
      checks: ReconciliationCheck[];
      count: number;
    }>
  >('/reconciliation-checks/run', data);
  return res.data.data;
}

export async function getReconciliationSummary(businessDayId: string) {
  const res = await apiClient.get<
    ApiResponse<{
      business_day_id: string;
      checks: ReconciliationCheck[];
      summary: Record<
        string,
        { total: number; balanced: number; exception: number }
      >;
    }>
  >(`/reconciliation-checks/summary/${businessDayId}`);
  return res.data.data;
}

// ─── EXCEPTIONS ─────────────────────────────────────────────────────
export interface AppException {
  id: string;
  exception_ref: string;
  property_id: string;
  business_day_id: string;
  shift_id: string | null;
  exception_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  amount: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'escalated' | 'closed';
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  assigned_to_user?: { id: string; full_name: string };
  resolved_by_user?: { id: string; full_name: string };
  property?: { id: string; code: string; name: string };
}

export async function listExceptions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  exception_type?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<AppException>>(
    '/exceptions',
    { params }
  );
  return res.data;
}

export async function getException(id: string) {
  const res = await apiClient.get<ApiResponse<AppException>>(
    `/exceptions/${id}`
  );
  return res.data.data;
}

export async function createException(data: {
  exception_type: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reference_type?: string | null;
  reference_id?: string | null;
  description: string;
  amount?: number | null;
}) {
  const res = await apiClient.post<ApiResponse<AppException>>(
    '/exceptions',
    data
  );
  return res.data.data;
}

export async function investigateException(
  id: string,
  data: { notes?: string; assigned_to?: string | null }
) {
  const res = await apiClient.post<ApiResponse<AppException>>(
    `/exceptions/${id}/investigate`,
    data
  );
  return res.data.data;
}

export async function resolveException(
  id: string,
  data: { resolution: string }
) {
  const res = await apiClient.post<ApiResponse<AppException>>(
    `/exceptions/${id}/resolve`,
    data
  );
  return res.data.data;
}

// ─── AUDIT ──────────────────────────────────────────────────────────
export interface EventLogEntry {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  property_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  occurred_at: string;
  created_at: string;
  actor?: { id: string; full_name: string; username: string };
  property?: { id: string; code: string; name: string };
}

export async function listAuditEvents(params?: {
  search?: string;
  area?: string;
  page?: number;
  limit?: number;
  event_type?: string;
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  from?: string;
  to?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<EventLogEntry>>(
    '/audit/events',
    { params }
  );
  return res.data;
}

export async function getAuditEvent(id: string) {
  const res = await apiClient.get<ApiResponse<EventLogEntry>>(
    `/audit/events/${id}`
  );
  return res.data.data;
}

export async function listAuditEventsByEntity(
  entityType: string,
  entityId: string
) {
  const res = await apiClient.get<ApiResponse<EventLogEntry[]>>(
    `/audit/events/entity/${entityType}/${entityId}`
  );
  return res.data.data;
}