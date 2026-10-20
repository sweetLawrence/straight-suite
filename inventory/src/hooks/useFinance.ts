import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/finance';

type Scope = { year?: number; month?: number; property_id?: string };

export const useStatement = (p: Scope) => useQuery({ queryKey: ['finance-statement', p], queryFn: () => api.getStatement(p), placeholderData: keepPreviousData });
export const useOverview = (p: { from?: string; to?: string; property_id?: string }) =>
  useQuery({ queryKey: ['finance-overview', p], queryFn: () => api.getOverview(p), placeholderData: keepPreviousData, refetchInterval: 30000 });
export const useItemProfit = (p: { from?: string; to?: string; property_id?: string }) =>
  useQuery({ queryKey: ['finance-items', p], queryFn: () => api.getItemProfit(p), placeholderData: keepPreviousData, refetchInterval: 60000 });
export const useCostOfSales = (p: Scope) => useQuery({ queryKey: ['finance-cos', p], queryFn: () => api.getCostOfSales(p), placeholderData: keepPreviousData });

export function usePeriodAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { kind: 'close'; year: number; month: number; property_id?: string } | { kind: 'reopen'; year: number; month: number; property_id?: string; reason: string }) =>
      a.kind === 'close' ? api.closeMonth(a) : api.reopenMonth(a),
    onSuccess: () => ['finance-statement', 'finance-cos', 'notifications'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}

export const useEtims = (p: { page?: number; limit?: number; status?: string; search?: string; property_id?: string }) =>
  useQuery({ queryKey: ['etims', p], queryFn: () => api.listEtims(p), placeholderData: keepPreviousData, refetchInterval: 30000 });
export const useEtimsFor = (type: 'bill' | 'event', id: string | undefined) =>
  useQuery({ queryKey: ['etims-for', type, id], queryFn: () => api.etimsFor(type, id!), enabled: !!id });
export const useEtimsDevice = () => useQuery({ queryKey: ['etims-device'], queryFn: api.getEtimsDevice });

export function useEtimsAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a:
      | { kind: 'resend'; id: string }
      | { kind: 'save'; property_id?: string; kra_pin?: string; bhf_id?: string; device_serial?: string }
      | { kind: 'initialise'; property_id?: string }) => {
      if (a.kind === 'resend') return api.resendEtims(a.id);
      if (a.kind === 'save') return api.saveEtimsDevice(a);
      return api.initialiseEtims(a.property_id);
    },
    onSuccess: () => ['etims', 'etims-device', 'etims-for'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}
