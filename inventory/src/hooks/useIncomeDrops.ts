import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmIncomeDrop, getMoneyCheck, getToDrop, getMyIncome, handIn, listIncomeDrops, rejectIncomeDrop } from '@/lib/api/incomeDrops';

export const useMyIncome = (enabled = true) => useQuery({ queryKey: ['income-drops', 'mine'], queryFn: getMyIncome, enabled });
export const useIncomeDrops = (status: string, enabled = true) =>
  useQuery({ queryKey: ['income-drops', 'list', status], queryFn: () => listIncomeDrops(status), enabled, refetchInterval: 30000 });
export const useMoneyCheck = (params: { from?: string; to?: string; property_id?: string }, enabled = true) =>
  useQuery({ queryKey: ['money-check', params], queryFn: () => getMoneyCheck(params), enabled });

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['income-drops'] });
    qc.invalidateQueries({ queryKey: ['money-check'] });
    qc.invalidateQueries({ queryKey: ['cashier'] });
  };
};
export const useHandIn = () => { const inv = useInvalidate(); return useMutation({ mutationFn: handIn, onSuccess: inv }); };
export const useConfirmIncomeDrop = () => { const inv = useInvalidate(); return useMutation({ mutationFn: confirmIncomeDrop, onSuccess: inv }); };
export const useRejectIncomeDrop = () => { const inv = useInvalidate(); return useMutation({ mutationFn: rejectIncomeDrop, onSuccess: inv }); };

export const useToDrop = (enabled = true) => useQuery({ queryKey: ['cashier', 'to-drop'], queryFn: getToDrop, enabled, refetchInterval: 60000 });
