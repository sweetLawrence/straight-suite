import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface TransferLine {
  id: string;
  transfer_id: string;
  stock_item_id: string;
  batch_id: string | null;
  requested_qty: string;
  dispatched_qty: string | null;
  received_qty: string | null;
  unit_id: string;
  variance: string | null;
  cost_amount: string | null;
  notes: string | null;
  stock_item?: {
    id: string;
    pack_size?: number | null;
    pack_label?: string | null;
    item?: { id: string; code: string; name: string };
  };
  batch?: { id: string; batch_ref: string };
  unit?: { id: string; code: string; name: string };
  resolutions?: Array<{
    id: string;
    resolution_type: string;
    quantity: string;
    reason: string | null;
  }>;
}

export interface Transfer {
  id: string;
  transfer_ref: string;
  source_property_id: string;
  destination_type: 'hotel' | 'external';
  destination_property_id: string | null;
  destination_name: string | null;
  destination_contact_name: string | null;
  destination_contact_phone: string | null;
  destination_acknowledgement_ref: string | null;
  reason: string;
  requested_by: string;
  requested_at: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  dispatched_by: string | null;
  dispatched_at: string | null;
  received_by: string | null;
  received_at: string | null;
  resolved_at: string | null;
  aging_flagged_at: string | null;
  in_transit_owner_property_id: string | null;
  source_property?: { id: string; code: string; name: string };
  destination_property?: { id: string; code: string; name: string };
  requested_by_user?: { id: string; full_name: string; username: string };
  approved_by_user?: { id: string; full_name: string };
  dispatched_by_user?: { id: string; full_name: string };
  received_by_user?: { id: string; full_name: string };
  transfer_lines?: TransferLine[];
  approvals?: Array<{
    id: string;
    decision: string;
    decision_at: string;
    notes: string | null;
    approver?: { id: string; full_name: string };
  }>;
  resolutions?: Array<{
    id: string;
    resolution_type: string;
    quantity: string;
    reason: string | null;
    resolved_at: string;
  }>;
}

export async function listTransfers(params?: {
  page?: number;
  limit?: number;
  status?: string;
  source_property_id?: string;
  destination_property_id?: string;
  destination_type?: string;
  kind?: 'food' | 'bar';
}) {
  const res = await apiClient.get<PaginatedResponse<Transfer>>('/transfers', {
    params,
  });
  return res.data;
}

export async function listIncomingTransfers(params?: {
  page?: number;
  limit?: number;
  property_id?: string;
  kind?: 'food' | 'bar';
}) {
  const res = await apiClient.get<PaginatedResponse<Transfer>>(
    '/transfers/incoming',
    { params }
  );
  return res.data;
}

export async function getTransfer(id: string) {
  const res = await apiClient.get<ApiResponse<Transfer>>(`/transfers/${id}`);
  return res.data.data;
}

export interface TransferCreateData {
  destination_type: 'hotel' | 'external';
  destination_property_id?: string;
  destination_name?: string;
  destination_contact_name?: string;
  destination_contact_phone?: string;
  reason: string;
  lines: Array<{
    stock_item_id: string;
    batch_id?: string | null;
    requested_qty?: number;
    pack_qty?: number;
    unit_id?: string;
    notes?: string | null;
  }>;
}

export async function createTransfer(data: TransferCreateData) {
  const res = await apiClient.post<ApiResponse<Transfer>>('/transfers', data);
  return res.data.data;
}

export async function approveTransfer(id: string, data?: { notes?: string }) {
  const res = await apiClient.post<ApiResponse<Transfer>>(
    `/transfers/${id}/approve`,
    data || {}
  );
  return res.data.data;
}

export async function rejectTransfer(id: string, data?: { notes?: string }) {
  const res = await apiClient.post<ApiResponse<Transfer>>(
    `/transfers/${id}/reject`,
    data || {}
  );
  return res.data.data;
}

export async function dispatchTransfer(
  id: string,
  data: {
    lines: Array<{
      transfer_line_id: string;
      dispatched_qty: number;
      notes?: string | null;
    }>;
  }
) {
  const res = await apiClient.post<ApiResponse<Transfer>>(
    `/transfers/${id}/dispatch`,
    data
  );
  return res.data.data;
}

export async function receiveTransfer(
  id: string,
  data: {
    lines: Array<{
      transfer_line_id: string;
      received_qty: number;
      notes?: string | null;
    }>;
  }
) {
  const res = await apiClient.post<ApiResponse<Transfer>>(
    `/transfers/${id}/receive`,
    data
  );
  return res.data.data;
}

export async function resolveTransfer(
  id: string,
  data: {
    resolutions: Array<{
      transfer_line_id: string;
      resolution_type:
        | 'short_receipt'
        | 'damaged'
        | 'disputed'
        | 'lost'
        | 'written_off';
      quantity: number;
      unit_id: string;
      cost_amount?: number | null;
      reason?: string | null;
    }>;
  }
) {
  const res = await apiClient.post<ApiResponse<Transfer>>(
    `/transfers/${id}/resolve`,
    data
  );
  return res.data.data;
}