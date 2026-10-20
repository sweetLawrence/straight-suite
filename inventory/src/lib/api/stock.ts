import type { ListFilters } from './listFilters';
import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── Stock Items ────────────────────────────────────────────────────
export interface StockItem {
  id: string;
  item_id: string;
  property_id: string;
  stock_model: 'portioned' | 'bulk' | 'packaged' | 'produced';
  store_type: 'food_store' | 'bar_store' | 'kitchen';
  reorder_level: string | null;
  status: string;
  item?: {
    id: string;
    code: string;
    name: string;
    item_type: string;
    base_unit?: { id: string; code: string; name: string } | null;
  };
  property?: { id: string; code: string; name: string };

   dispatch_mode: 'by_weight' | 'by_portion' | 'by_count';
  pack_size?: number | null;
  pack_label?: string | null;
}

export async function listStockItems(params?: ListFilters & {
  page?: number;
  limit?: number;
  store_type?: string;
  stock_model?: string;
  status?: string;
  property_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<StockItem>>('/stock/items', {
    params,
  });
  return res.data;
}

export async function getStockItem(id: string) {
  const res = await apiClient.get<ApiResponse<StockItem>>(`/stock/items/${id}`);
  return res.data.data;
}

export interface StockBalance {
  stock_item: StockItem;
  balance: number;
  unit?: { id: string; code: string; name: string } | null;
  recent_entries: LedgerEntry[];
}

export async function getStockItemBalance(id: string) {
  const res = await apiClient.get<ApiResponse<StockBalance>>(
    `/stock/items/${id}/balance`
  );
  return res.data.data;
}

// ─── Batches ────────────────────────────────────────────────────────
export interface Batch {
  id: string;
  batch_ref: string;
  stock_item_id: string;
  property_id: string;
  supplier_id: string | null;
  purchase_ref: string | null;
  received_qty: string;
  pack_size?: number | null;
  packs_received?: number | null;
  received_unit_id: string;
  total_cost: string;
  cost_per_unit: string | null;
  received_at: string;
  received_by: string | null;
  expiry_date: string | null;
  status: 'active' | 'depleted' | 'expired' | 'written_off';

  // ─── Portioning ────────────────────────────────────────────────
  portion_definition_id: string | null;
  total_portions: number | null;
  available_portions: number | null;
  cost_per_portion: string | null;
  portioned_at: string | null;
  portioned_by: string | null;

  stock_item?: StockItem;
  received_unit?: { id: string; code: string; name: string };
  received_by_user?: { id: string; full_name: string };
  portion_definition?: {
    id: string;
    portion_name: string;
    portion_size: string;
    sell_price: string;
  } | null;
}

export async function listBatches(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<Batch>>('/stock/batches', {
    params,
  });
  return res.data;
}

export async function getBatch(id: string) {
  const res = await apiClient.get<ApiResponse<Batch>>(`/stock/batches/${id}`);
  return res.data.data;
}

export async function getBatchPortions(
  id: string,
  params?: { page?: number; limit?: number }
) {
  const res = await apiClient.get<PaginatedResponse<Portion>>(
    `/stock/batches/${id}/portions`,
    { params }
  );
  return res.data;
}

export async function createBatch(data: {
  stock_item_id: string;
  received_qty: number;
  received_unit_id: string;
  total_cost: number;
  purchase_ref?: string;
  supplier_id?: string;
  expiry_date?: string;
  received_at?: string;
  pack_size?: number | null;
  packs_received?: number | null;
}) {
  const res = await apiClient.post<ApiResponse<Batch>>('/stock/batches', data);
  return res.data.data;
}

// ─── Portioning ─────────────────────────────────────────────────────
export interface PortioningEvent {
  id: string;
  batch_id: string;
  stock_item_id: string;
  property_id: string;
  input_qty: string;
  input_unit_id: string;
  expected_portions: number;
  actual_portions: number;
  variance: number;
  portion_size: string;
  portion_unit_id: string;
  cost_per_portion: string;
  portioned_by: string | null;
  portioned_at: string;
  notes: string | null;
  batch?: Batch;
}

export async function listPortioningEvents(params?: {
  page?: number;
  limit?: number;
  batch_id?: string;
  stock_item_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<PortioningEvent>>(
    '/stock/portioning-events',
    { params }
  );
  return res.data;
}

export async function createPortioningEvent(data: {
  batch_id: string;
  portion_definition_id: string;
  actual_portions: number;
  cost_per_portion: number;
  notes?: string;
}) {
  const res = await apiClient.post<ApiResponse<PortioningEvent>>(
    '/stock/portioning-events',
    data
  );
  return res.data.data;
}

// ─── Portions ───────────────────────────────────────────────────────
export interface Portion {
  id: string;
  portion_ref: string;
  batch_id: string;
  stock_item_id: string;
  property_id: string;
  portion_definition_id: string;
  portion_size: string;
  portion_unit_id: string;
  sell_price: string;
  cost_basis: string;
  status:
    | 'available'
    | 'issued'
    | 'sold'
    | 'wasted'
    | 'staff_meal'
    | 'transferred'
    | 'returned';
  portioned_at: string;
  portion_definition?: {
    id: string;
    portion_name: string;
    sell_price: string;
  };
  portion_unit?: { id: string; code: string; name: string };
}

export async function listPortions(params?: {
  page?: number;
  limit?: number;
  batch_id?: string;
  stock_item_id?: string;
  status?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<Portion>>('/stock/portions', {
    params,
  });
  return res.data;
}

// ─── Bulk Issues ────────────────────────────────────────────────────
export interface BulkIssue {
  id: string;
  bulk_issue_ref: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  stock_item_id: string;
  quantity: string;
  unit_id: string;
  purpose: string;
  issued_by: string;
  issued_at: string;
  stock_item?: StockItem;
  unit?: { id: string; code: string; name: string };
  issued_by_user?: { id: string; full_name: string };
}

export async function listBulkIssues(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<BulkIssue>>(
    '/stock/bulk-issues',
    { params }
  );
  return res.data;
}

export async function createBulkIssue(data: {
  stock_item_id: string;
  quantity: number;
  unit_id: string;
  purpose: string;
}) {
  const res = await apiClient.post<ApiResponse<BulkIssue>>(
    '/stock/bulk-issues',
    data
  );
  return res.data.data;
}

// ─── Ledger ─────────────────────────────────────────────────────────
export interface LedgerEntry {
  id: string;
  property_id: string;
  stock_item_id: string;
  batch_id: string | null;
  portion_id: string | null;
  event_type: string;
  quantity: string;
  unit_id: string;
  reference_type: string | null;
  reference_id: string | null;
  business_day_id: string;
  shift_id: string | null;
  performed_by: string;
  performed_at: string;
  reason: string | null;
  stock_item?: StockItem;
  batch?: Batch;
  unit?: { id: string; code: string; name: string };
}

export async function listLedger(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
  batch_id?: string;
  event_type?: string;
  from?: string;
  to?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<LedgerEntry>>('/stock/ledger', {
    params,
  });
  return res.data;
}

export interface LedgerSummaryRow {
  stock_item_id: string;
  property_id: string;
  balance: number;
  item: { id: string; code: string; name: string; item_type: string } | null;
  stock_item: StockItem | null;
}

export async function getLedgerSummary() {
  const res = await apiClient.get<ApiResponse<LedgerSummaryRow[]>>(
    '/stock/ledger/summary'
  );
  return res.data.data;
}

// ─── Portion definitions (needed for portioning form) ──────────────
export interface PortionDefinition {
  id: string;
  stock_item_id: string;
  property_id: string;
  portion_name: string;
  portion_size: string;
  portion_unit_id: string;
  sell_price: string;
  status: string;
}

export async function listPortionDefinitions(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<PortionDefinition>>(
    '/menu/portion-definitions',
    { params }
  );
  return res.data;
}





// ─── Stock Item CRUD ───────────────────────────────────────────────
// export async function createStockItem(data: {
//   item_id: string;
//   property_id?: string;
//   stock_model: 'portioned' | 'bulk' | 'packaged' | 'produced';
//   store_type: 'food_store' | 'bar_store' | 'kitchen';
//   reorder_level?: number | null;
// }) {
//   const res = await apiClient.post<ApiResponse<StockItem>>('/stock/items', data);
//   return res.data.data;
// }


export async function createStockItem(data: {
  item_id?: string;
  property_id?: string;
  code?: string;
  name?: string;
  item_type?: 'stock_portioned' | 'stock_bulk' | 'stock_packaged' | 'stock_produced';
  base_unit_id?: string | null;
  stock_model: 'portioned' | 'bulk' | 'packaged' | 'produced';
  store_type: 'food_store' | 'bar_store' | 'kitchen';
  dispatch_mode?: 'by_weight' | 'by_portion' | 'by_count';
  reorder_level?: number | null;
  pack_size?: number | null;
  pack_label?: string | null;
  portion?: {
    name: string;
    size: number;
    unit_id: string;
    sell_price: number;
  } | null;
}) {
  const res = await apiClient.post<ApiResponse<StockItem>>('/stock/items', data);
  return res.data.data;
}




export async function updateStockItem(
  id: string,
  data: Partial<{
    stock_model: 'portioned' | 'bulk' | 'packaged' | 'produced';
    store_type: 'food_store' | 'bar_store' | 'kitchen';
    dispatch_mode: 'by_weight' | 'by_portion' | 'by_count';
    reorder_level: number | null;
    status: 'active' | 'inactive' | 'discontinued';
    pack_size: number | null;
    pack_label: string | null;
    barcode: string | null;
  }>
) {
  const res = await apiClient.patch<ApiResponse<StockItem>>(
    `/stock/items/${id}`,
    data
  );
  return res.data.data;
}
// ─── Barcodes ──────────────────────────────────────────────────────
export interface BarcodeHit {
  stock_item_id: string;
  name: string;
  code: string;
  store_type: string;
  property: string;
  unit: string | null;
  balance: number;
}
export async function lookupBarcode(code: string) {
  const res = await apiClient.get<ApiResponse<BarcodeHit[]>>(`/tools/barcode/${encodeURIComponent(code)}`);
  return res.data.data;
}
