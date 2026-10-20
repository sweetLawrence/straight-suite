import { apiClient, ApiResponse } from './client';

/** What happens to stock already poured or sent to the kitchen */
export type StockAction = 'return' | 'waste';

export async function editOrderLine(
  orderId: string,
  lineId: string,
  data: { quantity: number; reason: string; stock_action: StockAction }
) {
  const res = await apiClient.patch<ApiResponse<{ quantity: number }>>(`/orders/${orderId}/lines/${lineId}`, data);
  return res.data.data;
}

export async function removeOrderLine(
  orderId: string,
  lineId: string,
  data: { reason: string; stock_action: StockAction }
) {
  const res = await apiClient.post<ApiResponse<{ removed: boolean }>>(`/orders/${orderId}/lines/${lineId}/remove`, data);
  return res.data.data;
}

export async function voidBill(billId: string, data: { reason: string; stock_action: StockAction }) {
  const res = await apiClient.post<ApiResponse<{ id: string; status: string }>>(`/bills/${billId}/void`, data);
  return res.data.data;
}

export async function recordHouseUse(data: { stock_item_id: string; quantity: number; notes?: string }) {
  const res = await apiClient.post<ApiResponse<{ item: string; quantity: number; cost: number }>>('/house-use', data);
  return res.data.data;
}
