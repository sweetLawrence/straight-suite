import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoomIssue, listRoomIssues, markRoomIssueBilled } from '@/lib/api/roomIssues';

export function useRoomIssues(params: { page?: number; limit?: number; room?: string; to_bill?: string }) {
  return useQuery({ queryKey: ['room-issues', params], queryFn: () => listRoomIssues(params), placeholderData: keepPreviousData });
}

const refresh = (qc: ReturnType<typeof useQueryClient>) =>
  ['room-issues', 'ledger-summary', 'batches', 'stock-items', 'notifications'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

export function useCreateRoomIssue() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRoomIssue, onSuccess: () => refresh(qc) });
}

export function useMarkRoomBilled() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: markRoomIssueBilled, onSuccess: () => refresh(qc) });
}
