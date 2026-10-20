import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/accounts';
import { getItemProfit, getOverview } from '@/lib/api/finance';
import type { AccountsTab } from '@/components/accounts/reports';

export interface AccountsParams { from?: string; to?: string; property_id?: string; year?: number }

const fetchers: Record<AccountsTab, (p: AccountsParams) => Promise<unknown>> = {
  daily: (p) => api.getDailySales(p),
  summary: (p) => getOverview(p),
  itemprofit: (p) => getItemProfit(p),
  daybook: (p) => api.getDayBook(p),
  debtors: (p) => api.getDebtors(p),
  suppliers: (p) => api.getSuppliers(p),
  purchases: (p) => api.getPurchases(p),
  expenses: (p) => api.getExpenses(p),
  vat: (p) => api.getVat({ year: p.year, property_id: p.property_id }),
  journal: (p) => api.getJournal(p),
  stock: (p) => api.getStockValue(p),
};

/** One accounts tab's data */
export const useAccountsTab = (tab: AccountsTab, p: AccountsParams, enabled = true) =>
  useQuery({
    queryKey: ['accounts', tab, p],
    queryFn: () => fetchers[tab](p),
    // Keep the old figures on screen only while the same tab reloads (new dates); never show another tab's data
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === tab ? prev : undefined),
    enabled,
  });

export const useSupplierStatement = (id: string, p: api.RangeParams) =>
  useQuery({ queryKey: ['accounts', 'supplier', id, p], queryFn: () => api.getSupplierStatement(id, p), placeholderData: keepPreviousData, enabled: !!id });

export function useSupplierEntry() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['accounts'] });
  return {
    record: useMutation({ mutationFn: api.recordSupplierEntry, onSuccess: done }),
    voidEntry: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.voidSupplierEntry(id, reason), onSuccess: done }),
  };
}
