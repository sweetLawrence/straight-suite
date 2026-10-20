import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelPO,
  createPO,
  getPO,
  getPriceHistory,
  getReorder,
  listPOs,
  listSuppliers,
  receivePO,
  saveSupplier,
  quickSupplier,
  type SupplierInput,
} from '@/lib/api/purchasing';

const refresh = (qc: ReturnType<typeof useQueryClient>) =>
  ['suppliers', 'purchase-orders', 'purchase-order', 'reorder', 'price-history', 'ledger-summary', 'batches', 'bar-stock', 'notifications'].forEach(
    (k) => qc.invalidateQueries({ queryKey: [k] })
  );

export const useSuppliers = () => useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers });
export function useSaveSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { data: SupplierInput; id?: string }) => saveSupplier(v.data, v.id), onSuccess: () => refresh(qc) });
}
export const usePOs = (params: { page?: number; limit?: number; status?: string }) =>
  useQuery({ queryKey: ['purchase-orders', params], queryFn: () => listPOs(params), placeholderData: keepPreviousData });
export const usePO = (id: string) => useQuery({ queryKey: ['purchase-order', id], queryFn: () => getPO(id) });
export function useCreatePO() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createPO, onSuccess: () => refresh(qc) });
}
export function useReceivePO(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Parameters<typeof receivePO>[1]) => receivePO(id, data), onSuccess: () => refresh(qc) });
}
export function useCancelPO(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (reason: string) => cancelPO(id, reason), onSuccess: () => refresh(qc) });
}
export const useReorder = (params: { store_type?: string; property_id?: string }) =>
  useQuery({ queryKey: ['reorder', params], queryFn: () => getReorder(params), placeholderData: keepPreviousData });
export const usePriceHistory = (stockItemId: string | null) =>
  useQuery({ queryKey: ['price-history', stockItemId], queryFn: () => getPriceHistory(stockItemId!), enabled: !!stockItemId });

/** Add a supplier by name from a picker */
export function useQuickSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: quickSupplier, onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }) });
}
