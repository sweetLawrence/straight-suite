import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closeBusinessDay,
  closeShift,
  getDayStatus,
  reopenBusinessDay,
  startNextShift,
} from '@/lib/api/businessDay';

export function useDayStatus(propertyId?: string) {
  return useQuery({
    queryKey: ['business-day', 'status', propertyId ?? 'mine'],
    queryFn: () => getDayStatus(propertyId),
    refetchInterval: 60_000,
  });
}

// Anything that changes the day/shift refreshes every day/shift query
function useDayMutation<A, R>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-day'] });
      qc.invalidateQueries({ queryKey: ['shift'] });
    },
  });
}

export const useStartNextShift = () => useDayMutation(startNextShift);
export const useCloseShift = () => useDayMutation(closeShift);
export const useCloseBusinessDay = () => useDayMutation(closeBusinessDay);
export const useReopenBusinessDay = () => useDayMutation(reopenBusinessDay);
