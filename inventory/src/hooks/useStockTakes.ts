import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelStockTake,
  decideStockTake,
  getStockTake,
  getVariances,
  listStockTakes,
  saveCounts,
  startStockTake,
  submitStockTake,
} from '@/lib/api/stockTakes';

const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  ['stock-takes', 'stock-take', 'variances', 'approvals', 'notifications', 'ledger', 'ledger-summary', 'bar-stock', 'batches'].forEach(
    (k) => qc.invalidateQueries({ queryKey: [k] })
  );
};

export function useStockTakes(params: { page?: number; limit?: number; status?: string; store_type?: string }) {
  return useQuery({ queryKey: ['stock-takes', params], queryFn: () => listStockTakes(params), placeholderData: keepPreviousData });
}

export function useStockTake(id: string) {
  return useQuery({ queryKey: ['stock-take', id], queryFn: () => getStockTake(id) });
}

export function useStartStockTake() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: startStockTake, onSuccess: () => refresh(qc) });
}

/** Autosave: does not refetch, so the counter's typing is never overwritten */
export function useSaveCounts(id: string) {
  return useMutation({
    mutationFn: (lines: { id: string; counted_qty: number | null; note?: string | null }[]) => saveCounts(id, lines),
  });
}

export function useSubmitStockTake(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (notes?: string) => submitStockTake(id, notes), onSuccess: () => refresh(qc) });
}

export function useCancelStockTake(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => cancelStockTake(id), onSuccess: () => refresh(qc) });
}

export function useDecideStockTake(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { decision: 'approve' | 'reject'; notes?: string }) => decideStockTake(id, v.decision, v.notes),
    onSuccess: () => refresh(qc),
  });
}

export function useVariances(params: { from?: string; to?: string; store_type?: string; property_id?: string }) {
  return useQuery({ queryKey: ['variances', params], queryFn: () => getVariances(params), placeholderData: keepPreviousData });
}
