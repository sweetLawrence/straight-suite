import { apiClient, ApiResponse, PaginatedResponse } from './client';

export type EventStatus = 'quote' | 'confirmed' | 'completed' | 'cancelled';

export interface EventItem {
  id: string;
  event_ref: string;
  invoice_ref: string | null;
  title: string;
  event_type: string;
  status: EventStatus;
  property?: { id: string; code: string; name: string; address?: string | null; phone?: string | null; kra_pin?: string | null };
  client: { name: string; phone: string | null; email: string | null; kra_pin: string | null };
  start_at: string;
  end_at: string | null;
  venue: string | null;
  guests: number;
  price_per_person: number;
  goat_plan: 'none' | 'own' | 'full';
  goat_count: number;
  goat_fee: number;
  goat_total: number;
  goat_cost: number;
  vat_enabled: boolean;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  paid: number;
  balance: number;
  stock_cost: number;
  profit: number;
  notes: string | null;
  created_by: { id: string; full_name: string } | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  reminded_at: string | null;
  cancel_reason: string | null;
  menu: { id: string; description: string }[];
  extras: { id: string; description: string; quantity: number; unit_price: number; line_total: number }[];
  payments: { id: string; amount: number; method: string; reference: string | null; notes: string | null; paid_at: string; received_by: string | null }[];
  stock: { id: string; stock_item_id: string; name: string; unit: string | null; planned_qty: number; issued_qty: number; returned_qty: number; used_qty: number; cost: number }[];
}

export interface EventInput {
  property_id?: string;
  title: string;
  event_type?: string;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  client_kra_pin?: string | null;
  start_at: string;
  end_at?: string | null;
  venue?: string | null;
  guests: number;
  price_per_person: number;
  goat_plan: 'none' | 'own' | 'full';
  goat_count: number;
  goat_fee: number;
  goat_cost: number;
  vat_enabled: boolean;
  notes?: string | null;
  menu: { description: string }[];
  extras: { description: string; quantity: number; unit_price: number }[];
  stock: { stock_item_id: string; planned_qty: number }[];
}

const d = <T,>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

export const listEvents = async (params: { page?: number; limit?: number; when?: string; status?: string }) =>
  (await apiClient.get<PaginatedResponse<EventItem>>('/events', { params })).data;
export const getEvent = (id: string) => d<EventItem>(apiClient.get(`/events/${id}`));
export const createEvent = (data: EventInput) => d<EventItem>(apiClient.post('/events', data));
export const updateEvent = (id: string, data: EventInput) => d<EventItem>(apiClient.put(`/events/${id}`, data));
export const confirmEvent = (id: string) => d<EventItem>(apiClient.post(`/events/${id}/confirm`));
export const completeEvent = (id: string) => d<EventItem>(apiClient.post(`/events/${id}/complete`));
export const cancelEvent = (id: string, reason: string) => d<EventItem>(apiClient.post(`/events/${id}/cancel`, { reason }));
export const addEventPayment = (id: string, data: { amount: number; method: string; reference?: string; notes?: string }) =>
  d<EventItem>(apiClient.post(`/events/${id}/payments`, data));
export const issueEventStock = (id: string, lineId: string, quantity: number) =>
  d<EventItem>(apiClient.post(`/events/${id}/stock/${lineId}/issue`, { quantity }));
export const returnEventStock = (id: string, lineId: string, quantity: number) =>
  d<EventItem>(apiClient.post(`/events/${id}/stock/${lineId}/return`, { quantity }));
export const emailEventInvoice = (id: string, to?: string) =>
  d<{ to: string; configured: boolean; sent: number; reason?: string }>(apiClient.post(`/events/${id}/email`, to ? { to } : {}));
