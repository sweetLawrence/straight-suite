import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listStaffMeals,
  getStaffMeal,
  createStaffMeal,
  cancelStaffMeal,
  listWaste,
  getWaste,
  createWaste,
  listReturns,
  getReturn,
  createReturn,
  listDisputes,
  getDispute,
  createDispute,
  resolveDispute,
  dispatchStaffMeal,
  receiveStaffMeal,
} from '@/lib/api/operations';

// ─── STAFF MEALS ────────────────────────────────────────────────────
export function useStaffMeals(params?: {
  page?: number;
  limit?: number;
  meal_type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['staff-meals', params],
    queryFn: () => listStaffMeals(params),
  });
}

export function useStaffMeal(id: string | undefined) {
  return useQuery({
    queryKey: ['staff-meal', id],
    queryFn: () => getStaffMeal(id!),
    enabled: !!id,
  });
}

export function useCreateStaffMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStaffMeal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-meals'] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

export function useCancelStaffMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelStaffMeal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-meals'] });
    },
  });
}

// ─── WASTE ──────────────────────────────────────────────────────────
export function useWasteList(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
}) {
  return useQuery({
    queryKey: ['waste', params],
    queryFn: () => listWaste(params),
  });
}

export function useWaste(id: string | undefined) {
  return useQuery({
    queryKey: ['waste-record', id],
    queryFn: () => getWaste(id!),
    enabled: !!id,
  });
}

export function useCreateWaste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWaste,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waste'] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

// ─── RETURNS ────────────────────────────────────────────────────────
export function useReturns(params?: {
  page?: number;
  limit?: number;
  return_type?: string;
}) {
  return useQuery({
    queryKey: ['returns', params],
    queryFn: () => listReturns(params),
  });
}

export function useReturn(id: string | undefined) {
  return useQuery({
    queryKey: ['return', id],
    queryFn: () => getReturn(id!),
    enabled: !!id,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

// ─── DISPUTES ───────────────────────────────────────────────────────
export function useDisputes(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['disputes', params],
    queryFn: () => listDisputes(params),
  });
}

export function useDispute(id: string | undefined) {
  return useQuery({
    queryKey: ['dispute', id],
    queryFn: () => getDispute(id!),
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDispute,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useResolveDispute(disputeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { resolution: string }) =>
      resolveDispute(disputeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disputes'] });
      qc.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
  });
}





import { fetchDailyStaffMealStatus } from '@/lib/api/operations';

export function useDailyStaffMealStatus(
  params: {
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'supper';
    property_id?: string;
  },
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['staff-meals-daily', params],
    queryFn: () => fetchDailyStaffMealStatus(params),
    enabled: (options.enabled ?? true) && !!params.date && !!params.meal_type,
  });
}











import { apiClient } from '@/lib/api/client';

export interface ScheduleLookupItem {
  stock_item_id: string;
  stock_item_name: string;
  quantity: number;
  unit_id: string;
  unit_name: string;
}

export interface ScheduleLookupResponse {
  date: string;
  meal_type: string;
  source: 'week' | 'standing' | null;
  items: ScheduleLookupItem[];
}

async function fetchScheduleLookup(params: {
  date: string;
  meal_type: string;
}): Promise<ScheduleLookupResponse> {
  const res = await apiClient.get<{ data: ScheduleLookupResponse }>(
    '/staff-menu/lookup',
    { params }
  );
  return res.data.data;
}

export function useScheduleLookup(params: {
  date?: string | null;
  meal_type?: string | null;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['staff-menu-lookup', params.date, params.meal_type],
    queryFn: () =>
      fetchScheduleLookup({
        date: params.date!,
        meal_type: params.meal_type!,
      }),
    enabled: (params.enabled ?? true) && !!params.date && !!params.meal_type,
    retry: false,
  });
}
export function useStaffMealStep(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { step: 'dispatch' | 'receive'; notes?: string }) =>
      v.step === 'dispatch' ? dispatchStaffMeal(id) : receiveStaffMeal(id, v.notes),
    onSuccess: () => ['staff-meal', 'staff-meals', 'staff-meals-daily', 'ledger', 'ledger-summary', 'notifications'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}
