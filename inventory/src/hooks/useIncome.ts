import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createIncome, listIncome, listPrices, listVenues, saveVenue, saveVenueRates, setPrice, voidIncome } from '@/lib/api/income';

export function useIncome(params: { page?: number; limit?: number; stream?: string; from?: string; to?: string }) {
  return useQuery({ queryKey: ['income', params], queryFn: () => listIncome(params), placeholderData: keepPreviousData });
}

const refresh = (qc: ReturnType<typeof useQueryClient>) =>
  ['income', 'cashier-summary', 'accounts', 'finance', 'notifications'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createIncome, onSuccess: () => refresh(qc) });
}

export function useVoidIncome() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; reason: string }) => voidIncome(v.id, v.reason), onSuccess: () => refresh(qc) });
}

/** Rooms, halls or conference rooms of the signed-in property */
export function useVenues(kind?: 'room' | 'hall' | 'conference') {
  return useQuery({ queryKey: ['venues', kind ?? 'all'], queryFn: () => listVenues(kind), staleTime: 5 * 60 * 1000 });
}

export function useSaveVenue() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: saveVenue, onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }) });
}

/** Fixed prices of the income streams. Group level passes the property. */
export function useIncomePrices(propertyId?: string | null, enabled = true) {
  return useQuery({ queryKey: ['income-prices', propertyId ?? 'mine'], queryFn: () => listPrices(propertyId ?? undefined), enabled });
}

export function useSetIncomePrice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: setPrice, onSuccess: () => qc.invalidateQueries({ queryKey: ['income-prices'] }) });
}

export function useSaveVenueRates() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, rates }: { id: string; rates: Parameters<typeof saveVenueRates>[1] }) => saveVenueRates(id, rates), onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }) });
}
