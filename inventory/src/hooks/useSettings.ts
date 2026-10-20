import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, setSignedBill, setVat } from '@/lib/api/settings';

export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: getSettings, staleTime: 60000 });

/** Switching VAT changes every money figure, so everything is reloaded */
export function useSetVat() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: setVat, onSuccess: () => qc.invalidateQueries() });
}

export function useSetSignedBill() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: setSignedBill, onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }) });
}
