import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAdjustments,
  getAdjustment,
  createAdjustment,
  decideAdjustment,
  listReconciliationChecks,
  getReconciliationCheck,
  runReconciliation,
  getReconciliationSummary,
  listExceptions,
  getException,
  createException,
  investigateException,
  resolveException,
  listAuditEvents,
  getAuditEvent,
  listAuditEventsByEntity,
} from '@/lib/api/admin';

// ─── ADJUSTMENTS ────────────────────────────────────────────────────
export function useAdjustments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  adjustment_type?: string;
}) {
  return useQuery({
    queryKey: ['adjustments', params],
    queryFn: () => listAdjustments(params),
  });
}

export function useAdjustment(id: string | undefined) {
  return useQuery({
    queryKey: ['adjustment', id],
    queryFn: () => getAdjustment(id!),
    enabled: !!id,
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdjustment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adjustments'] });
    },
  });
}

export function useDecideAdjustment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { decision: 'approved' | 'rejected'; notes?: string }) =>
      decideAdjustment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adjustments'] });
      qc.invalidateQueries({ queryKey: ['adjustment', id] });
    },
  });
}

// ─── RECONCILIATION ─────────────────────────────────────────────────
export function useReconciliationChecks(params?: {
  page?: number;
  limit?: number;
  check_type?: string;
  status?: string;
  business_day_id?: string;
}) {
  return useQuery({
    queryKey: ['reconciliation-checks', params],
    queryFn: () => listReconciliationChecks(params),
  });
}

export function useReconciliationCheck(id: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation-check', id],
    queryFn: () => getReconciliationCheck(id!),
    enabled: !!id,
  });
}

export function useRunReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runReconciliation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reconciliation-checks'] });
    },
  });
}

export function useReconciliationSummary(businessDayId: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation-summary', businessDayId],
    queryFn: () => getReconciliationSummary(businessDayId!),
    enabled: !!businessDayId,
  });
}

// ─── EXCEPTIONS ─────────────────────────────────────────────────────
export function useExceptions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  exception_type?: string;
}) {
  return useQuery({
    queryKey: ['exceptions', params],
    queryFn: () => listExceptions(params),
  });
}

export function useException(id: string | undefined) {
  return useQuery({
    queryKey: ['exception', id],
    queryFn: () => getException(id!),
    enabled: !!id,
  });
}

export function useCreateException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createException,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
    },
  });
}

export function useInvestigateException(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { notes?: string; assigned_to?: string | null }) =>
      investigateException(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      qc.invalidateQueries({ queryKey: ['exception', id] });
    },
  });
}

export function useResolveException(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { resolution: string }) => resolveException(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      qc.invalidateQueries({ queryKey: ['exception', id] });
    },
  });
}

// ─── AUDIT ──────────────────────────────────────────────────────────
export function useAuditEvents(params?: {
  page?: number;
  limit?: number;
  event_type?: string;
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['audit-events', params],
    queryFn: () => listAuditEvents(params),
  });
}

export function useAuditEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['audit-event', id],
    queryFn: () => getAuditEvent(id!),
    enabled: !!id,
  });
}

export function useAuditEventsByEntity(
  entityType: string | undefined,
  entityId: string | undefined
) {
  return useQuery({
    queryKey: ['audit-events-entity', entityType, entityId],
    queryFn: () => listAuditEventsByEntity(entityType!, entityId!),
    enabled: !!entityType && !!entityId,
  });
}