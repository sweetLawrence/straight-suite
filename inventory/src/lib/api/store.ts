import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── Queue ──────────────────────────────────────────────────────────
export interface QueueLine {
  order_line_id: string;
  menu_item_id: string;
  menu_item_name: string | null;
  quantity: number;
  notes: string | null;
  status: string;
}

export interface QueueOrder {
  order_id: string;
  order_ref: string;
  customer_code: string;
  table_number: string | null;
  created_at: string;
  /** When food was last added to this order */
  latest_at?: string;
  status: string;
  waiter: { id: string; full_name: string } | null;
  property: { id: string; code: string } | null;
  lines: QueueLine[];
}

export async function listQueue(params?: { page?: number; limit?: number }) {
  const res = await apiClient.get<PaginatedResponse<QueueOrder>>('/store/queue', {
    params,
  });
  return res.data;
}

// ─── Preview ────────────────────────────────────────────────────────
export interface PreviewComponent {
  stock_item_id: string;
  stock_item: { id: string; stock_model: 'portioned' | 'packaged' | 'produced' | 'bulk' };
  item: { id: string; code: string; name: string };
  unit_id: string;
  total_qty: number;
  breakdown: {
    order_line_id: string;
    menu_item_name: string | null;
    menu_qty: number;
    component_qty: number;
  }[];
  availability: { available: number | null; unit: string | null };
  sufficient?: boolean;
}

export interface DispatchPreview {
  order: {
    id: string;
    order_ref: string;
    customer_code: string;
    table_number: string | null;
    property: { id: string; code: string } | null;
  };
  lines_count: number;
  components: PreviewComponent[];
}

export async function getDispatchPreview(orderId: string) {
  const res = await apiClient.get<ApiResponse<DispatchPreview>>(
    `/store/orders/${orderId}/preview-dispatch`
  );
  return res.data.data;
}

// ─── Dispatch ───────────────────────────────────────────────────────
export interface IssueSlipLine {
  id: string;
  issue_slip_id: string;
  order_line_id: string;
  stock_item_id: string | null;
  quantity: string;
  unit_id: string | null;
  notes: string | null;
  created_at: string;
  order_line?: {
    id: string;
    order_id: string;
    menu_item_id: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    station: 'kitchen' | 'bar';
    outlet: 'restaurant' | 'bar';
    status: string;
    notes?: string | null;
    menu_item?: {
      id: string;
      display_name: string;
      item?: { id: string; code: string; name: string };
    };
  };
  stock_item?: {
    id: string;
    item_id: string;
    stock_model: string;
    store_type: string;
    item?: { id: string; code: string; name: string };
  };
  unit?: { id: string; code: string; name: string };
}

export interface IssueSlip {
  id: string;
  slip_ref: string;
  order_id: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  printed_by: string;
  printed_at: string;
  reprint_count: number;
  status: 'printed' | 'reprinted' | 'cancelled';
  received_by: string | null;
  received_at: string | null;
  order?: {
    id: string;
    order_ref: string;
    customer_code: string;
    table_number: string | null;
    status: string;
    created_at?: string;
    waiter?: { id: string; full_name: string } | null;
  };
 property?: {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  kra_pin?: string | null;
  address?: string | null;
  logo_url?: string | null;
};
  printed_by_user?: { id: string; full_name: string };
  received_by_user?: { id: string; full_name: string } | null;
  issue_slip_lines?: IssueSlipLine[];
}

export async function dispatchOrder(orderId: string) {
  const res = await apiClient.post<ApiResponse<IssueSlip>>(
    `/store/orders/${orderId}/dispatch`,
    {}
  );
  return res.data.data;
}

export async function getSlip(id: string) {
  const res = await apiClient.get<ApiResponse<IssueSlip>>(`/issue-slips/${id}`);
  return res.data.data;
}

export async function listSlips(params?: {
  page?: number;
  limit?: number;
  order_id?: string;
  business_day_id?: string;
  shift_id?: string;
  status?: string;
  received?: 'true' | 'false';
}) {
  const res = await apiClient.get<PaginatedResponse<IssueSlip>>('/store/slips', {
    params,
  });
  return res.data;
}

export async function receiveSlip(id: string) {
  const res = await apiClient.post<ApiResponse<IssueSlip>>(
    `/issue-slips/${id}/receive`
  );
  return res.data.data;
}

export async function reprintSlip(id: string) {
  const res = await apiClient.post<ApiResponse<IssueSlip>>(
    `/issue-slips/${id}/reprint`
  );
  return res.data.data;
}