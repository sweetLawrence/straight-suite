import type { ListFilters } from './listFilters';
// import { apiClient, ApiResponse, PaginatedResponse } from './client';

// // ─── Orders ─────────────────────────────────────────────────────────
// export interface OrderLine {
//   id: string;
//   order_id: string;
//   menu_item_id: string;
//   quantity: string;
//   unit_price: string;
//   line_total: string;
//   station: 'kitchen' | 'bar';
//   outlet: 'restaurant' | 'bar';
//   status: 'pending' | 'issued' | 'partially_issued' | 'served' | 'cancelled';
//   notes: string | null;
//   menu_item?: {
//     id: string;
//     display_name: string;
//     price: string;
//     station: string | null;
//   };
//   issues?: Array<{
//     id: string;
//     quantity: string;
//     portion_id: string | null;
//     batch_id: string | null;
//     status: string;
//   }>;
// }

// export interface Order {
//   id: string;
//   order_ref: string;
//   customer_code: string;
//   property_id: string;
//   business_day_id: string;
//   shift_id: string;
//   waiter_id: string;
//   table_number: string | null;
//   station: 'kitchen' | 'bar' | 'both' | null;
//   outlet: 'restaurant' | 'bar' | 'both';
//   approval_status: 'pending' | 'approved' | 'rejected' | null;
//   approved_by: string | null;
//   approved_at: string | null;
//   status:
//     | 'open'
//     | 'pending_approval'
//     | 'in_progress'
//     | 'served'
//     | 'billed'
//     | 'closed'
//     | 'cancelled';
//   created_at: string;
//   updated_at: string;
//   waiter?: { id: string; full_name: string; username: string };
//   approved_by_user?: { id: string; full_name: string } | null;
//   property?: { id: string; code: string; name: string };
//   order_lines?: OrderLine[];
//   bill?: Bill | null;
//   bills?: Bill[];
// }

// export async function listOrders(params?: {
//   page?: number;
//   limit?: number;
//   waiter_id?: string;
//   status?: string;
//   business_day_id?: string;
//   shift_id?: string;
//   table_number?: string;
//   outlet?: 'restaurant' | 'bar' | 'both';
//   approval_status?: 'pending' | 'approved' | 'rejected';
// }) {
//   const res = await apiClient.get<PaginatedResponse<Order>>('/orders', { params });
//   return res.data;
// }

// export async function getOrder(id: string) {
//   const res = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
//   return res.data.data;
// }

// export async function createOrder(data: {
//   table_number?: string;
//   station?: 'kitchen' | 'bar' | 'both';
// }) {
//   const res = await apiClient.post<ApiResponse<Order>>('/orders', data);
//   return res.data.data;
// }

// export async function addOrderLine(
//   orderId: string,
//   data: {
//     menu_item_id: string;
//     quantity: number;
//     notes?: string;
//   }
// ) {
//   const res = await apiClient.post<ApiResponse<Order>>(
//     `/orders/${orderId}/lines`,
//     data
//   );
//   return res.data.data;
// }

// export async function generateBill(orderId: string) {
//   const res = await apiClient.post<ApiResponse<Bill>>(`/orders/${orderId}/bill`);
//   return res.data.data;
// }

// // ─── Bills ──────────────────────────────────────────────────────────
// export interface BillLine {
//   id: string;
//   bill_id: string;
//   order_line_id: string | null;
//   menu_item_id: string;
//   description: string;
//   quantity: string;
//   unit_price: string;
//   line_total: string;
//   menu_item?: { id: string; display_name: string };
// }

// export interface BillDiscount {
//   id: string;
//   bill_id: string;
//   amount: string;
//   reason: string;
//   authorized_by: string;
//   authorized_at: string;
//   authorized_by_user?: { id: string; full_name: string };
// }

// export interface PaymentLine {
//   id: string;
//   payment_id: string;
//   method: 'cash' | 'mpesa' | 'card' | 'cheque' | 'house' | 'other';
//   amount: string;
//   transaction_ref: string | null;
//   verification_status: 'pending' | 'verified' | 'unverified' | 'failed' | 'disputed';
// }

// export interface Payment {
//   id: string;
//   payment_ref: string;
//   bill_id: string;
//   total_amount: string;
//   status: 'pending' | 'partially_verified' | 'verified' | 'disputed';
//   payment_lines?: PaymentLine[];
// }

// export interface Bill {
//   id: string;
//   bill_ref: string;
//   // order_id: string;
//   parent_order_id: string;
//   customer_code: string;
//   property_id: string;
//   business_day_id: string;
//   shift_id: string;
//   waiter_id: string;
//   outlet: 'restaurant' | 'bar';
//   gross_total: string;
//   discount_total: string;
//   net_total: string;
//   status: 'open' | 'paid' | 'closed' | 'refunded' | 'voided';
//   opened_at: string;
//   closed_at: string | null;
//   created_at: string;
//   waiter?: { id: string; full_name: string; username: string };
//   property?: { id: string; code: string; name: string };
//   bill_lines?: BillLine[];
//   discounts?: BillDiscount[];
//   payment?: Payment | null;
//   order?: Order;
// }

// export async function listBills(params?: {
//   page?: number;
//   limit?: number;
//   waiter_id?: string;
//   status?: string;
//   business_day_id?: string;
//   shift_id?: string;
//   outlet?: 'restaurant' | 'bar';
// }) {
//   const res = await apiClient.get<PaginatedResponse<Bill>>('/bills', { params });
//   return res.data;
// }

// export async function getBill(id: string) {
//   const res = await apiClient.get<ApiResponse<Bill>>(`/bills/${id}`);
//   return res.data.data;
// }

// export async function applyDiscount(
//   billId: string,
//   data: { amount: number; reason: string }
// ) {
//   const res = await apiClient.post<ApiResponse<Bill>>(
//     `/bills/${billId}/discounts`,
//     data
//   );
//   return res.data.data;
// }






















import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── Orders ─────────────────────────────────────────────────────────
export interface OrderLine {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  station: 'kitchen' | 'bar';
  outlet: 'restaurant' | 'bar';
  status: 'pending' | 'issued' | 'partially_issued' | 'served' | 'cancelled';
  notes: string | null;
  menu_item?: {
    id: string;
    display_name: string;
    price: string;
    station: string | null;
  };
  issues?: Array<{
    id: string;
    quantity: string;
    portion_id: string | null;
    batch_id: string | null;
    status: string;
  }>;
}

export interface Order {
  id: string;
  order_ref: string;
  customer_code: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  waiter_id: string;
  table_number: string | null;
  station: 'kitchen' | 'bar' | 'both' | null;
  outlet: 'restaurant' | 'bar' | 'both';
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  approved_by: string | null;
  approved_at: string | null;
  status:
    | 'open'
    | 'in_progress'
    | 'served'
    | 'billed'
    | 'closed'
    | 'cancelled';
  created_at: string;
  updated_at: string;
  waiter?: { id: string; full_name: string; username: string };
  property?: { id: string; code: string; name: string };
  order_lines?: OrderLine[];
  bill?: Bill | null;
  bills?: Bill[];
}

export async function listOrders(params?: ListFilters & {
  page?: number;
  limit?: number;
  waiter_id?: string;
  status?: string;
  business_day_id?: string;
  shift_id?: string;
  table_number?: string;
  outlet?: 'restaurant' | 'bar' | 'both';
  approval_status?: 'pending' | 'approved' | 'rejected';
}) {
  const res = await apiClient.get<PaginatedResponse<Order>>('/orders', {
    params,
  });
  return res.data;
}

export async function getOrder(id: string) {
  const res = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data.data;
}

export async function createOrder(data: {
  table_number?: string;
  station?: 'kitchen' | 'bar' | 'both';
}) {
  const res = await apiClient.post<ApiResponse<Order>>('/orders', data);
  return res.data.data;
}

export async function addOrderLine(
  orderId: string,
  data: {
    menu_item_id: string;
    quantity: number;
    notes?: string;
  }
) {
  const res = await apiClient.post<ApiResponse<Order>>(
    `/orders/${orderId}/lines`,
    data
  );
  return res.data.data;
}

export async function generateBill(orderId: string) {
  const res = await apiClient.post<ApiResponse<Bill>>(`/orders/${orderId}/bill`);
  return res.data.data;
}

export async function approveBarOrder(orderId: string) {
  const res = await apiClient.post<ApiResponse<Order>>(
    `/orders/${orderId}/approve-bar`
  );
  return res.data.data;
}

export async function rejectBarOrder(
  orderId: string,
  data: { notes: string }
) {
  const res = await apiClient.post<ApiResponse<Order>>(
    `/orders/${orderId}/reject-bar`,
    data
  );
  return res.data.data;
}

// ─── Bills ──────────────────────────────────────────────────────────
export interface BillLine {
  id: string;
  bill_id: string;
  order_line_id: string | null;
  menu_item_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  menu_item?: { id: string; display_name: string };
}

export interface BillDiscount {
  id: string;
  bill_id: string;
  amount: string;
  reason: string;
  authorized_by: string;
  authorized_at: string;
  authorized_by_user?: { id: string; full_name: string };
}

export interface PaymentLine {
  id: string;
  payment_id: string;
  method: 'cash' | 'mpesa' | 'card' | 'cheque' | 'house' | 'other';
  amount: string;
  transaction_ref: string | null;
  verification_status:
    | 'pending'
    | 'verified'
    | 'unverified'
    | 'failed'
    | 'disputed';
}

export interface Payment {
  id: string;
  payment_ref: string;
  bill_id: string;
  total_amount: string;
  status: 'pending' | 'partially_verified' | 'verified' | 'disputed';
  payment_lines?: PaymentLine[];
}

export interface Bill {
  id: string;
  bill_ref: string;
  order_id: string;
  parent_order_id?: string | null;
  customer_code: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  waiter_id: string;
  outlet: 'restaurant' | 'bar';
  gross_total: string;
  discount_total: string;
  net_total: string;
  status: 'open' | 'paid' | 'closed' | 'refunded' | 'voided';
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  /** Customer paid vs money confirmed: none | awaiting_verification | verified | failed */
  payment_state?: 'none' | 'awaiting_verification' | 'verified' | 'failed';
  waiter?: { id: string; full_name: string; username: string };
  /** Guest pays later (e.g. staying in the hotel) */
  pay_later?: boolean;
  pay_later_guest?: string | null;
  pay_later_room?: string | null;
  pay_later_phone?: string | null;
  pay_later_due?: string | null;
  pay_later_note?: string | null;
  

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


  bill_lines?: BillLine[];
  discounts?: BillDiscount[];
  payment?: Payment | null;
  order?: Order;
}

export async function listBills(params?: ListFilters & {
  page?: number;
  limit?: number;
  waiter_id?: string;
  status?: string;
  business_day_id?: string;
  shift_id?: string;
  outlet?: 'restaurant' | 'bar';
}) {
  const res = await apiClient.get<PaginatedResponse<Bill>>('/bills', {
    params,
  });
  return res.data;
}

export async function getBill(id: string) {
  const res = await apiClient.get<ApiResponse<Bill>>(`/bills/${id}`);
  return res.data.data;
}

export async function applyDiscount(
  billId: string,
  data: { amount: number; reason: string }
) {
  const res = await apiClient.post<ApiResponse<Bill>>(
    `/bills/${billId}/discounts`,
    data
  );
  return res.data.data;
}

// ─── Bar Issuing ────────────────────────────────────────────────────
export interface BarPendingLine {
  order_line_id: string;
  order_id: string;
  order_ref: string;
  customer_code: string;
  table_number: string | null;
  waiter_name: string | null;
  created_at: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: string;
  stock_item: { id: string; item_name: string } | null;
  /** Current stock of each drink the line uses (from its recipe) */
  stock?: {
    name: string;
    per_unit: number;
    in_stock: number;
    pack_size: number | null;
    pack_label: string | null;
  }[];
}

export interface BarIssueResult {
  order_line_id: string;
  order_ref: string;
  item_name: string;
  issued: {
    order_line_issue_id: string;
    stock_name: string;
    stock_item_id: string;
    quantity: number;
    batch_ref: string;
    /** What is left of this drink after the issue */
    remaining: number;
  }[];
}

export async function listBarPending(params?: {
  page?: number;
  limit?: number;
}) {
  const res = await apiClient.get<PaginatedResponse<BarPendingLine>>(
    '/order-line-issues/bar-pending',
    { params }
  );
  return res.data;
}

export async function issueBarLine(orderLineId: string) {
  const res = await apiClient.post<ApiResponse<BarIssueResult>>(
    '/order-line-issues/bar-issue',
    { order_line_id: orderLineId }
  );
  return res.data.data;
}