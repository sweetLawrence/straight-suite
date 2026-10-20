import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closeKitchenIssue, getExpiring, getKitchenDay } from '@/lib/api/kitchen';

export const useKitchenDay = (date?: string) =>
  useQuery({ queryKey: ['kitchen-day', date], queryFn: () => getKitchenDay({ date }), placeholderData: keepPreviousData });

export const useExpiring = (days: number) => useQuery({ queryKey: ['expiring', days], queryFn: () => getExpiring(days) });

export function useCloseKitchenIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; returned_qty: number; wasted_qty: number; notes?: string }) =>
      closeKitchenIssue(v.id, { returned_qty: v.returned_qty, wasted_qty: v.wasted_qty, notes: v.notes }),
    onSuccess: () => ['kitchen-day', 'expiring', 'ledger', 'ledger-summary', 'batches', 'waste'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}
