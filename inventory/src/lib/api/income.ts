import { apiClient, ApiResponse, PaginatedResponse } from './client';

export type IncomeStream = 'pool' | 'pool_kids' | 'train' | 'washroom' | 'playground' | 'parking' | 'bus_hire' | 'hall_hire' | 'accommodation' | 'other';

export const STREAM_LABEL: Record<IncomeStream, string> = {
  pool: 'Swimming: adults',
  pool_kids: 'Swimming: kids',
  train: 'Train ride',
  washroom: 'Washrooms',
  playground: 'Playground',
  parking: 'Parking',
  bus_hire: 'Bus hire',
  hall_hire: 'Hall hire',
  accommodation: 'Accommodation',
  other: 'Other',
};

export interface IncomeEntry {
  id: string;
  entry_ref: string;
  stream: IncomeStream;
  stream_label: string;
  amount: number;
  method: string;
  transaction_ref: string | null;
  quantity: number | null;
  description: string | null;
  details: Record<string, string | number | null>;
  venue: { id: string; name: string } | null;
  recorded_by: { id: string; full_name: string } | null;
  property: { id: string; code: string } | null;
  voided: boolean;
  void_reason: string | null;
  created_at: string;
}

export async function listIncome(params: { page?: number; limit?: number; stream?: string; from?: string; to?: string }) {
  const res = await apiClient.get<
    PaginatedResponse<IncomeEntry> & { by_stream: { stream: IncomeStream; label: string; total: number }[]; total: number }
  >('/income', { params });
  return res.data;
}

export interface IncomePrice { stream: Exclude<IncomeStream, 'other'>; label: string; unit: string; price: number; is_default: boolean; group_price: number | null; group_min: number; can_group: boolean }

export async function listPrices(propertyId?: string) {
  const res = await apiClient.get<ApiResponse<IncomePrice[]>>('/income/prices', { params: { property_id: propertyId } });
  return res.data.data;
}

export async function setPrice(data: { stream: IncomePrice['stream']; price: number; group_price?: number | null; property_id?: string }) {
  const res = await apiClient.put<ApiResponse<IncomePrice[]>>('/income/prices', data);
  return res.data.data;
}

export async function createIncome(data: {
  stream: IncomeStream;
  amount?: number;
  method: string;
  transaction_ref?: string;
  quantity?: number;
  description?: string;
  venue_id?: string;
  rate_id?: string;
  details?: Record<string, unknown>;
}) {
  const res = await apiClient.post<ApiResponse<IncomeEntry>>('/income', data);
  return res.data.data;
}

export async function voidIncome(id: string, reason: string) {
  const res = await apiClient.post<ApiResponse<IncomeEntry>>(`/income/${id}/void`, { reason });
  return res.data.data;
}

export async function parkingLookup(plate: string) {
  const res = await apiClient.get<ApiResponse<{ found: boolean; plate?: string; owner_name?: string; owner_phone?: string; vehicle?: string; visits?: number }>>(
    '/income/parking/lookup',
    { params: { plate } }
  );
  return res.data.data;
}

export interface Venue {
  id: string;
  kind: 'room' | 'hall' | 'conference';
  name: string;
  capacity: number | null;
  property?: { id: string; code: string };
  is_demo?: boolean;
  rates?: VenueRate[];
}

export interface VenueRate { id?: string; label: string; hours: number | null; price: number }

export async function listVenues(kind?: string) {
  const res = await apiClient.get<ApiResponse<Venue[]>>('/venues', { params: { kind } });
  return res.data.data;
}

export async function saveVenue(v: { id?: string; kind?: Venue['kind']; name?: string; capacity?: number | null; property_id?: string; status?: 'active' | 'retired' }) {
  const { id, ...body } = v;
  const res = id ? await apiClient.patch<ApiResponse<Venue>>(`/venues/${id}`, body) : await apiClient.post<ApiResponse<Venue>>('/venues', body);
  return res.data.data;
}

export async function saveVenueRates(id: string, rates: VenueRate[]) {
  const res = await apiClient.put<ApiResponse<Venue>>(`/venues/${id}/rates`, { rates: rates.map((r) => ({ label: r.label, hours: r.hours || null, price: r.price })) });
  return res.data.data;
}
