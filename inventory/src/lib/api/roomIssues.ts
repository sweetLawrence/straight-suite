import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface RoomIssue {
  id: string;
  issue_ref: string;
  room: string;
  guest_name: string | null;
  item: string | null;
  quantity: number;
  charge_to_room: boolean;
  cost_amount: number;
  sell_amount: number | null;
  note: string | null;
  issued_by: { id: string; full_name: string } | null;
  property: { id: string; code: string } | null;
  billed: boolean;
  billed_by: { id: string; full_name: string } | null;
  billed_at: string | null;
  created_at: string;
}

export async function listRoomIssues(params: { page?: number; limit?: number; room?: string; to_bill?: string }) {
  const res = await apiClient.get<PaginatedResponse<RoomIssue> & { to_bill_amount: number }>('/room-issues', { params });
  return res.data;
}

export async function createRoomIssue(data: {
  stock_item_id: string;
  quantity: number;
  room: string;
  guest_name?: string;
  charge_to_room: boolean;
  sell_amount?: number;
  note?: string;
}) {
  const res = await apiClient.post<ApiResponse<RoomIssue>>('/room-issues', data);
  return res.data.data;
}

export async function markRoomIssueBilled(id: string) {
  const res = await apiClient.post<ApiResponse<RoomIssue>>(`/room-issues/${id}/billed`);
  return res.data.data;
}
