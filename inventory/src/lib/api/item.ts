import { apiClient, ApiResponse, PaginatedResponse } from './client';

export type ItemType =
  | 'stock_portioned'
  | 'stock_bulk'
  | 'stock_packaged'
  | 'stock_produced'
  | 'menu'
  | 'service';

export interface MasterItem {
  id: string;
  code: string;
  name: string;
  item_type: ItemType;
  base_unit_id: string | null;
  status: 'active' | 'inactive' | 'discontinued';
  base_unit?: { id: string; code: string; name: string } | null;
  created_at: string;
  updated_at: string;
}

export async function listItems(params?: {
  page?: number;
  limit?: number;
  item_type?: ItemType;
  status?: string;
  search?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<MasterItem>>('/items', { params });
  return res.data;
}

export async function getItem(id: string) {
  const res = await apiClient.get<ApiResponse<MasterItem>>(`/items/${id}`);
  return res.data.data;
}

export async function createItem(data: {
  code: string;
  name: string;
  item_type: ItemType;
  base_unit_id?: string | null;
}) {
  const res = await apiClient.post<ApiResponse<MasterItem>>('/items', data);
  return res.data.data;
}

export async function updateItem(
  id: string,
  data: Partial<{
    code: string;
    name: string;
    item_type: ItemType;
    base_unit_id: string | null;
    status: 'active' | 'inactive' | 'discontinued';
  }>
) {
  const res = await apiClient.patch<ApiResponse<MasterItem>>(`/items/${id}`, data);
  return res.data.data;
}

export async function deleteItem(id: string) {
  const res = await apiClient.delete<ApiResponse<MasterItem>>(`/items/${id}`);
  return res.data.data;
}