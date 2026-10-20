import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listProductionBatches,
  getProductionBatch,
  createProductionBatch,
  addProductionInput,
  completeProductionBatch,
  listProductionVariances,
  listVarianceThresholds,
  createVarianceThreshold,
} from '@/lib/api/production';

export function useProductionBatches(params?: {
  page?: number;
  limit?: number;
  output_stock_item_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['production-batches', params],
    queryFn: () => listProductionBatches(params),
  });
}

export function useProductionBatch(id: string | undefined) {
  return useQuery({
    queryKey: ['production-batch', id],
    queryFn: () => getProductionBatch(id!),
    enabled: !!id,
  });
}

export function useCreateProductionBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProductionBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production-batches'] });
    },
  });
}

export function useAddProductionInput(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      stock_item_id: string;
      batch_id?: string | null;
      quantity: number;
      unit_id: string;
      cost_amount: number;
    }) => addProductionInput(batchId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production-batch', batchId] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

export function useCompleteProductionBatch(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { actual_output_qty: number; notes?: string }) =>
      completeProductionBatch(batchId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production-batch', batchId] });
      qc.invalidateQueries({ queryKey: ['production-batches'] });
      qc.invalidateQueries({ queryKey: ['production-variances'] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

export function useProductionVariances(params?: {
  page?: number;
  limit?: number;
  production_batch_id?: string;
  status?: string;
  variance_type?: string;
}) {
  return useQuery({
    queryKey: ['production-variances', params],
    queryFn: () => listProductionVariances(params),
  });
}

export function useVarianceThresholds(params?: {
  page?: number;
  limit?: number;
  property_id?: string;
}) {
  return useQuery({
    queryKey: ['variance-thresholds', params],
    queryFn: () => listVarianceThresholds(params),
  });
}

export function useCreateVarianceThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVarianceThreshold,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variance-thresholds'] });
    },
  });
}