import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTransfers,
  listIncomingTransfers,
  getTransfer,
  createTransfer,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  receiveTransfer,
  resolveTransfer,
} from '@/lib/api/transfers';

export function useTransfers(params?: {
  page?: number;
  limit?: number;
  status?: string;
  source_property_id?: string;
  destination_property_id?: string;
  destination_type?: string;
  kind?: 'food' | 'bar';
}) {
  return useQuery({
    queryKey: ['transfers', params],
    queryFn: () => listTransfers(params),
    refetchInterval: 10_000,
  });
}

export function useIncomingTransfers(params?: {
  page?: number;
  limit?: number;
  property_id?: string;
  kind?: 'food' | 'bar';
}) {
  return useQuery({
    queryKey: ['transfers-incoming', params],
    queryFn: () => listIncomingTransfers(params),
    refetchInterval: 10_000,
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: ['transfer', id],
    queryFn: () => getTransfer(id!),
    enabled: !!id,
    refetchInterval: 10_000,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers-incoming'] });
    },
  });
}

export function useApproveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { notes?: string } }) =>
      approveTransfer(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfer', vars.id] });
    },
  });
}

export function useRejectTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { notes?: string } }) =>
      rejectTransfer(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfer', vars.id] });
    },
  });
}

export function useDispatchTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        lines: Array<{
          transfer_line_id: string;
          dispatched_qty: number;
          notes?: string | null;
        }>;
      };
    }) => dispatchTransfer(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers-incoming'] });
      qc.invalidateQueries({ queryKey: ['transfer', vars.id] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

export function useReceiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        lines: Array<{
          transfer_line_id: string;
          received_qty: number;
          notes?: string | null;
        }>;
      };
    }) => receiveTransfer(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers-incoming'] });
      qc.invalidateQueries({ queryKey: ['transfer', vars.id] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

export function useResolveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
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
};
    }) => resolveTransfer(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfer', vars.id] });
    },
  });
}