import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBarMovements, getBarStock, setupTots, wasteTots } from '@/lib/api/barStock';

// Refreshes often so each drink drops as soon as the bar issues it
export function useBarStock(params: { from?: string; to?: string; property_id?: string } = {}) {
  return useQuery({
    queryKey: ['bar-stock', 'overview', params],
    queryFn: () => getBarStock(params),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
}

export function useBarMovements(id: string | null) {
  return useQuery({
    queryKey: ['bar-stock', 'movements', id],
    queryFn: () => getBarMovements(id as string),
    enabled: !!id,
    refetchInterval: 15_000,
  });
}

export function useSetupTots() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: setupTots, onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-stock'] }) });
}

export function useWasteTots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: wasteTots,
    onSuccess: () => ['bar-stock', 'waste', 'notifications'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}
