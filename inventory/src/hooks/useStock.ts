import type { ListFilters } from '@/lib/api/listFilters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listStockItems,
  getStockItemBalance,
  listBatches,
  getBatch,
  getBatchPortions,
  createBatch,
  listPortioningEvents,
  createPortioningEvent,
  listPortions,
  listBulkIssues,
  createBulkIssue,
  listLedger,
  getLedgerSummary,
  listPortionDefinitions,
  Batch,
  BulkIssue,
  PortioningEvent,
} from '@/lib/api/stock';

// ─── Stock items ────────────────────────────────────────────────────
export function useStockItems(params?: ListFilters & {
  page?: number;
  limit?: number;
  store_type?: string;
  stock_model?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['stock-items', params],
    queryFn: () => listStockItems(params),
  });
}

export function useStockItemBalance(id: string | undefined) {
  return useQuery({
    queryKey: ['stock-item-balance', id],
    queryFn: () => getStockItemBalance(id!),
    enabled: !!id,
  });
}

// ─── Batches ────────────────────────────────────────────────────────
export function useBatches(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: () => listBatches(params),
  });
}

export function useBatch(id: string | undefined) {
  return useQuery({
    queryKey: ['batch', id],
    queryFn: () => getBatch(id!),
    enabled: !!id,
  });
}

export function useBatchPortions(
  id: string | undefined,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['batch-portions', id, params],
    queryFn: () => getBatchPortions(id!, params),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

// ─── Portioning ─────────────────────────────────────────────────────
export function usePortioningEvents(params?: {
  page?: number;
  limit?: number;
  batch_id?: string;
}) {
  return useQuery({
    queryKey: ['portioning-events', params],
    queryFn: () => listPortioningEvents(params),
  });
}

export function useCreatePortioningEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPortioningEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portioning-events'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['portions'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

// ─── Portions ───────────────────────────────────────────────────────
export function usePortions(params?: {
  page?: number;
  limit?: number;
  batch_id?: string;
  stock_item_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['portions', params],
    queryFn: () => listPortions(params),
  });
}

// ─── Bulk issues ────────────────────────────────────────────────────
export function useBulkIssues(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['bulk-issues', params],
    queryFn: () => listBulkIssues(params),
  });
}

export function useCreateBulkIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBulkIssue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bulk-issues'] });
      qc.invalidateQueries({ queryKey: ['kitchen-day'] });
      qc.invalidateQueries({ queryKey: ['expiring'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

// ─── Ledger ─────────────────────────────────────────────────────────
export function useLedger(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
  event_type?: string;
}) {
  return useQuery({
    queryKey: ['ledger', params],
    queryFn: () => listLedger(params),
  });
}

export function useLedgerSummary() {
  return useQuery({
    queryKey: ['ledger-summary'],
    queryFn: getLedgerSummary,
  });
}

// ─── Portion definitions ────────────────────────────────────────────
export function usePortionDefinitions(stockItemId?: string) {
  return useQuery({
    queryKey: ['portion-definitions', stockItemId],
    queryFn: () => listPortionDefinitions({ stock_item_id: stockItemId, limit: 100 }),
    enabled: !!stockItemId,
  });
}


import {
  createStockItem,
  updateStockItem,
} from '@/lib/api/stock';

export function useCreateStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStockItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-items'] }),
  });
}

export function useUpdateStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateStockItem>[1];
    }) => updateStockItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-items'] }),
  });
}