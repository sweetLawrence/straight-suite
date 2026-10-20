import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getStockSheet } from '@/lib/api/stockSheet';

export const useStockSheet = (p: { from?: string; to?: string; store?: string; property_id?: string }, enabled = true) =>
  useQuery({ queryKey: ['stock-sheet', p], queryFn: () => getStockSheet(p), placeholderData: keepPreviousData, refetchInterval: 60000, enabled });
