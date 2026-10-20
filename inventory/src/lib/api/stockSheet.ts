import { apiClient, ApiResponse } from './client';

export type StoreType = 'bar_store' | 'food_store' | 'kitchen';
export interface SheetItem {
  stock_item_id: string;
  name: string;
  store: StoreType;
  unit: string | null;
  opening: number;
  received: number;
  sold: number;
  issued: number;
  waste: number;
  staff_house: number;
  transferred: number;
  corrected: number;
  closing: number;
  reorder_level: number | null;
  pack_size?: number | null;
  pack_label?: string | null;
  buy_price: number | null;
  sell_price: number | null;
  tots_per_bottle: number | null;
  profit_each: number | null;
  margin: number | null;
  sold_value: number | null;
  sold_cost: number | null;
  profit: number | null;
  closing_value: number | null;
}
export interface StockSheet {
  from: string;
  to: string;
  property_id: string;
  store: StoreType | 'all';
  items: SheetItem[];
  totals: { sold_value: number; sold_cost: number; profit: number; closing_value: number; opening_value: number; received_value: number };
}

export const getStockSheet = async (params: { from?: string; to?: string; store?: string; property_id?: string }) =>
  (await apiClient.get<ApiResponse<StockSheet>>('/stock-sheet', { params })).data.data;
