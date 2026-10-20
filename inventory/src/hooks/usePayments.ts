import type { ListFilters } from '@/lib/api/listFilters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listPayments,
  getPayment,
  createPayment,
  createPackage,
  getInHouse,
  listPendingVerification,
  verifyPaymentLine,
  decideSignedLine,
  listCashDrops,
  listPendingCashDrops,
  getCashDrop,
  createCashDrop,
  confirmCashDrop,
  rejectCashDrop,
  getCurrentHandover,
  getHandover,
} from '@/lib/api/payments';
// ─── Payments ───────────────────────────────────────────────────────
export function usePayments(params?: ListFilters & {
  page?: number;
  limit?: number;
  waiter_id?: string;
  status?: string;
  bill_id?: string;
}) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => listPayments(params),
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPayment(id!),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['bill', variables.bill_id] });
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['handover-current'] });
    },
  });
}

export function useInHouse(enabled = true) {
  return useQuery({ queryKey: ['in-house'], queryFn: getInHouse, enabled });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPackage,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['bill', v.bill_id] });
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['in-house'] });
    },
  });
}

// ─── Pending verification ──────────────────────────────────────────
export function usePendingVerification(params?: {
  page?: number;
  limit?: number;
  method?: string;
}, enabled = true) {
  return useQuery({
    queryKey: ['pending-verification', params],
    queryFn: () => listPendingVerification(params),
    enabled,
  });
}

export function useDecideSigned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { lineId: string; decision: 'approve' | 'reject'; note?: string }) =>
      decideSignedLine(v.lineId, { decision: v.decision, note: v.note }),
    onSuccess: () => {
      ['payments', 'payment', 'bills', 'bill', 'approvals', 'notifications', 'orders'].forEach((k) =>
        qc.invalidateQueries({ queryKey: [k] })
      );
    },
  });
}

export function useVerifyPaymentLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lineId,
      data,
    }: {
      lineId: string;
      data: {
        verification_status: 'verified' | 'unverified' | 'failed';
        verification_notes?: string;
      };
    }) => verifyPaymentLine(lineId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-verification'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment'] });
      qc.invalidateQueries({ queryKey: ['handover-current'] });
    },
  });
}

// ─── Cash drops ─────────────────────────────────────────────────────
export function useCashDrops(params?: ListFilters & {
  page?: number;
  limit?: number;
  waiter_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['cash-drops', params],
    queryFn: () => listCashDrops(params),
  });
}

export function useCashDrop(id: string | undefined) {
  return useQuery({
    queryKey: ['cash-drop', id],
    queryFn: () => getCashDrop(id!),
    enabled: !!id,
  });
}

export function useCreateCashDrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCashDrop,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cashier'] });
      qc.invalidateQueries({ queryKey: ['cash-drops'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['pending-verification'] });
      qc.invalidateQueries({ queryKey: ['handover-current'] });
    },
  });
}


export function usePendingCashDrops(params?: { page?: number; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: ['cash-drops-pending', params],
    queryFn: () => listPendingCashDrops(params),
    enabled,
    refetchInterval: 10_000,
  });
}

export function useConfirmCashDrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { receiver_role?: 'cashier' | 'supervisor' | 'manager'; notes?: string };
    }) => confirmCashDrop(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-drops'] });
      qc.invalidateQueries({ queryKey: ['cash-drops-pending'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['pending-verification'] });
      qc.invalidateQueries({ queryKey: ['handover-current'] });
    },
  });
}

export function useRejectCashDrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reason: string } }) =>
      rejectCashDrop(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-drops'] });
      qc.invalidateQueries({ queryKey: ['cash-drops-pending'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['handover-current'] });
    },
  });
}




// ─── Handover ───────────────────────────────────────────────────────
export function useCurrentHandover(enabled = true, which: 'current' | 'previous' = 'current') {
  return useQuery({
    queryKey: ['handover-current', which],
    queryFn: () => getCurrentHandover(which),
    retry: false,
    // A finished shift doesn't change; only poll the live one
    refetchInterval: which === 'current' ? 30_000 : false,
    enabled,
  });
}

export function useHandover(waiterId?: string, shiftId?: string) {
  return useQuery({
    queryKey: ['handover', waiterId, shiftId],
    queryFn: () => getHandover(waiterId!, shiftId!),
    enabled: !!waiterId && !!shiftId,
  });
}