import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { editSummary, getDaily, getStore, getValue, getWaiting, summaryAction } from '@/lib/api/daySummary';

type P = { date?: string; property_id?: string };
export const useDaily = (p: P, enabled = true) => useQuery({ queryKey: ['day-summary', 'daily', p], queryFn: () => getDaily(p), enabled });
export const useValue = (p: P, enabled = true) => useQuery({ queryKey: ['day-summary', 'value', p], queryFn: () => getValue(p), enabled });
export const useStore = (p: P, enabled = true) => useQuery({ queryKey: ['day-summary', 'store', p], queryFn: () => getStore(p), enabled });
export const useSummaryWaiting = (enabled = true) => useQuery({ queryKey: ['day-summary', 'waiting'], queryFn: () => getWaiting(), enabled, refetchInterval: 60000 });

export function useEditSummary() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: editSummary, onSuccess: () => qc.invalidateQueries({ queryKey: ['day-summary'] }) });
}
export function useSummaryAction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: summaryAction, onSuccess: () => qc.invalidateQueries({ queryKey: ['day-summary'] }) });
}
