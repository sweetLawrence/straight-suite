import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/payLater';

const refresh = (qc: ReturnType<typeof useQueryClient>) =>
  ['pay-later', 'bill', 'bills', 'business-day', 'notifications', 'finance-overview', 'cashier-summary'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

export const usePayLater = (p: { page?: number; limit?: number; status?: 'outstanding' | 'settled' | 'all'; outlet?: 'restaurant' | 'bar' }, enabled = true) =>
  useQuery({ queryKey: ['pay-later', p], queryFn: () => api.listPayLater(p), placeholderData: keepPreviousData, refetchInterval: 15000, enabled });

export function usePayLaterAction(billId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { kind: 'mark'; data: api.PayLaterInput } | { kind: 'cancel'; reason?: string }) =>
      a.kind === 'mark' ? api.markPayLater(billId, a.data) : api.cancelPayLater(billId, a.reason),
    onSuccess: () => refresh(qc),
  });
}
