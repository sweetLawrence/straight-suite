import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPettyCash,
  createRemittance,
  decidePettyCash,
  decideRemittance,
  getCashierSummary,
  getRemitReport,
  getWasteUnitCost,
  listCashiers,
  listPettyCash,
  listRemittances,
} from '@/lib/api/cashier';

const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  ['cashier-summary', 'remittances', 'remit-report', 'petty-cash', 'notifications', 'ledger-summary', 'batches', 'stock-items'].forEach((k) =>
    qc.invalidateQueries({ queryKey: [k] })
  );
};

export function useCashierSummary(params: { date?: string; cashier_id?: string }, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['cashier-summary', params],
    queryFn: () => getCashierSummary(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useCashiers(enabled: boolean) {
  return useQuery({ queryKey: ['cashier-people'], queryFn: listCashiers, enabled, staleTime: 300_000 });
}

export function useRemittances(params: { page?: number; limit?: number; status?: string }, enabled = true) {
  return useQuery({
    queryKey: ['remittances', params],
    queryFn: () => listRemittances(params),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useRemitReport(params: { from?: string; to?: string; property_id?: string }, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['remit-report', params],
    queryFn: () => getRemitReport(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useCreateRemittance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRemittance, onSuccess: () => refresh(qc) });
}

export function useDecideRemittance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; decision: 'receive' | 'dispute'; method?: string; received_amount?: number; lines?: { method: string; received_amount: number }[]; reason?: string }) =>
      decideRemittance(v.id, { decision: v.decision, method: v.method, received_amount: v.received_amount, lines: v.lines, reason: v.reason }),
    onSuccess: () => refresh(qc),
  });
}

export function usePettyCash(params: { page?: number; limit?: number; kind?: string }) {
  return useQuery({
    queryKey: ['petty-cash', params],
    queryFn: () => listPettyCash(params),
    placeholderData: keepPreviousData,
  });
}

export function useDecidePettyCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; decision: 'authorise' | 'reject'; note?: string }) => decidePettyCash(v.id, v.decision, v.note),
    onSuccess: () => {
      refresh(qc);
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useCreatePettyCash() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createPettyCash, onSuccess: () => refresh(qc) });
}

export function useWasteUnitCost(stockItemId: string | null) {
  return useQuery({
    queryKey: ['waste-unit-cost', stockItemId],
    queryFn: () => getWasteUnitCost(stockItemId!),
    enabled: !!stockItemId,
  });
}
