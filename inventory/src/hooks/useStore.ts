import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listQueue,
  getDispatchPreview,
  dispatchOrder,
  getSlip,
  listSlips,
  receiveSlip,
  reprintSlip,
} from '@/lib/api/store';

// ─── Queue ──────────────────────────────────────────────────────────
export function useStoreQueue(params?: { page?: number; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: ['store-queue', params],
    queryFn: () => listQueue(params),
    enabled,
    refetchInterval: 15_000, // auto-refresh: new orders appear
  });
}

// ─── Preview ────────────────────────────────────────────────────────
export function useDispatchPreview(orderId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-preview', orderId],
    queryFn: () => getDispatchPreview(orderId!),
    enabled: !!orderId,
  });
}

// ─── Dispatch ───────────────────────────────────────────────────────
export function useDispatchOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => dispatchOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-queue'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ─── Slips ──────────────────────────────────────────────────────────
export function useSlip(id: string | undefined) {
  return useQuery({
    queryKey: ['slip', id],
    queryFn: () => getSlip(id!),
    enabled: !!id,
  });
}

export function useStoreSlips(params?: {
  page?: number;
  limit?: number;
  received?: 'true' | 'false';
}) {
  return useQuery({
    queryKey: ['store-slips', params],
    queryFn: () => listSlips(params),
  });
}

export function useReceiveSlip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => receiveSlip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-slips'] });
      qc.invalidateQueries({ queryKey: ['slip'] });
    },
  });
}

export function useReprintSlip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reprintSlip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-slips'] });
      qc.invalidateQueries({ queryKey: ['slip'] });
    },
  });
}