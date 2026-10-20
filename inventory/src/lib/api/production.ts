import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface ProductionInput {
  id: string;
  production_batch_id: string;
  stock_item_id: string;
  batch_id: string | null;
  quantity: string;
  unit_id: string;
  cost_amount: string;
  stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
  };
  batch?: { id: string; batch_ref: string };
  unit?: { id: string; code: string; name: string };
}

export interface ProductionOutput {
  id: string;
  production_batch_id: string;
  stock_item_id: string;
  quantity: string;
  unit_id: string;
  cost_per_unit: string;
  total_cost: string;
  status: string;
  stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
  };
  unit?: { id: string; code: string; name: string };
}

export interface ProductionVariance {
  id: string;
  production_batch_id: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  variance_type: 'yield_shortfall' | 'yield_excess' | 'quality_reject' | 'recipe_deviation';
  expected_qty: string;
  actual_qty: string;
  variance_qty: string;
  variance_pct: string;
  cost_impact: string;
  reason: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'accepted';
  investigated_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  production_batch?: ProductionBatch;
  investigated_by_user?: { id: string; full_name: string };
}

export interface ProductionBatch {
  id: string;
  production_ref: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  output_stock_item_id: string;
  expected_output_qty: string;
  actual_output_qty: string;
  variance_qty: string;
  variance_pct: string;
  unit_id: string;
  produced_by: string;
  authorized_by: string | null;
  produced_at: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  output_stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
  };
  unit?: { id: string; code: string; name: string };
  produced_by_user?: { id: string; full_name: string };
  inputs?: ProductionInput[];
  outputs?: ProductionOutput[];
  variances?: ProductionVariance[];
}

export async function listProductionBatches(params?: {
  page?: number;
  limit?: number;
  output_stock_item_id?: string;
  status?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<ProductionBatch>>(
    '/production-batches',
    { params }
  );
  return res.data;
}

export async function getProductionBatch(id: string) {
  const res = await apiClient.get<ApiResponse<ProductionBatch>>(
    `/production-batches/${id}`
  );
  return res.data.data;
}

export async function createProductionBatch(data: {
  output_stock_item_id: string;
  unit_id: string;
  notes?: string;
}) {
  const res = await apiClient.post<ApiResponse<ProductionBatch>>(
    '/production-batches',
    data
  );
  return res.data.data;
}

export async function addProductionInput(
  batchId: string,
  data: {
    stock_item_id: string;
    batch_id?: string | null;
    quantity: number;
    unit_id: string;
    cost_amount: number;
  }
) {
  const res = await apiClient.post<ApiResponse<ProductionBatch>>(
    `/production-batches/${batchId}/inputs`,
    data
  );
  return res.data.data;
}

export async function completeProductionBatch(
  batchId: string,
  data: {
    actual_output_qty: number;
    notes?: string;
  }
) {
  const res = await apiClient.post<ApiResponse<ProductionBatch>>(
    `/production-batches/${batchId}/complete`,
    data
  );
  return res.data.data;
}

export async function listProductionVariances(params?: {
  page?: number;
  limit?: number;
  production_batch_id?: string;
  status?: string;
  variance_type?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<ProductionVariance>>(
    '/production-variances',
    { params }
  );
  return res.data;
}

// ─── Variance Thresholds ────────────────────────────────────────────
export interface VarianceThreshold {
  id: string;
  property_id: string;
  output_stock_item_id: string | null;
  warning_pct: string;
  critical_pct: string;
  auto_accept_pct: string;
  output_stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
  };
}

export async function listVarianceThresholds(params?: {
  page?: number;
  limit?: number;
  property_id?: string;
  output_stock_item_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<VarianceThreshold>>(
    '/variance-thresholds',
    { params }
  );
  return res.data;
}

export async function createVarianceThreshold(data: {
  output_stock_item_id?: string | null;
  warning_pct: number;
  critical_pct: number;
  auto_accept_pct: number;
}) {
  const res = await apiClient.post<ApiResponse<VarianceThreshold>>(
    '/variance-thresholds',
    data
  );
  return res.data.data;
}