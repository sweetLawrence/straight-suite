import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  kra_pin: string | null;
  supplies: string | null;
  payment_terms: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  deliveries_90d: number;
  spent_90d: number;
  last_delivery_at: string | null;
}
export type SupplierInput = Partial<Omit<Supplier, 'id' | 'deliveries_90d' | 'spent_90d' | 'last_delivery_at'>> & { name: string };

export type POStatus = 'ordered' | 'partially_received' | 'received' | 'cancelled';
export interface PurchaseOrder {
  id: string;
  po_ref: string;
  status: POStatus;
  expected_date: string | null;
  notes: string | null;
  total: number;
  created_at: string;
  closed_at: string | null;
  property?: { id: string; code: string };
  supplier: { id: string; name: string; phone: string | null } | null;
  created_by: { id: string; full_name: string } | null;
  lines?: {
    id: string;
    stock_item_id: string;
    name: string;
    unit: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    received_qty: number;
    outstanding: number;
  }[];
}

export interface ReorderItem {
  stock_item_id: string;
  name: string;
  code: string;
  store_type: string;
  property: string;
  unit: string | null;
  pack_size: number | null;
  pack_label: string | null;
  balance: number;
  reorder_level: number;
  on_order: number;
  status: 'low' | 'out';
  suggested_qty: number;
  last_unit_cost: number | null;
  last_received_at: string | null;
  supplier: { id: string; name: string } | null;
}

export interface PriceHistory {
  stock_item_id: string;
  name: string;
  unit: string | null;
  latest: number | null;
  change: number | null;
  lowest: number | null;
  highest: number | null;
  average: number | null;
  deliveries: {
    id: string;
    batch_ref: string;
    purchase_ref: string | null;
    received_at: string;
    quantity: number;
    total_cost: number;
    unit_cost: number;
    supplier: string | null;
  }[];
}

export const quickSupplier = async (name: string) =>
  (await apiClient.post<ApiResponse<Supplier & { existed: boolean }>>('/suppliers/quick', { name })).data.data;
export const listSuppliers = async () => (await apiClient.get<ApiResponse<Supplier[]>>('/suppliers')).data.data;
export const saveSupplier = async (data: SupplierInput, id?: string) =>
  (id
    ? await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data)
    : await apiClient.post<ApiResponse<Supplier>>('/suppliers', data)
  ).data.data;

export const listPOs = async (params: { page?: number; limit?: number; status?: string }) =>
  (await apiClient.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params })).data;
export const getPO = async (id: string) => (await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`)).data.data;
export const createPO = async (data: {
  supplier_id: string;
  property_id?: string;
  expected_date?: string | null;
  notes?: string;
  lines: { stock_item_id: string; quantity: number; unit_price: number }[];
}) => (await apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data)).data.data;
export const receivePO = async (
  id: string,
  data: { close?: boolean; lines: { line_id: string; quantity: number; unit_price?: number | null; expiry_date?: string | null }[] }
) => (await apiClient.post<ApiResponse<PurchaseOrder & { batches: string[] }>>(`/purchase-orders/${id}/receive`, data)).data.data;
export const cancelPO = async (id: string, reason: string) =>
  (await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`, { reason })).data.data;
export const getReorder = async (params: { store_type?: string; property_id?: string }) =>
  (await apiClient.get<ApiResponse<ReorderItem[]>>('/purchase-orders/reorder', { params })).data.data;
export const getPriceHistory = async (stockItemId: string) =>
  (await apiClient.get<ApiResponse<PriceHistory>>('/purchase-orders/price-history', { params: { stock_item_id: stockItemId } })).data
    .data;
