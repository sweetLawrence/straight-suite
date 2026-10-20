import type { ListFilters } from '@/lib/api/listFilters';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import {
//   listOrders,
//   getOrder,
//   createOrder,
//   addOrderLine,
//   generateBill,
//   listBills,
//   getBill,
//   applyDiscount,
// } from '@/lib/api/orders';

// // ─── Orders ─────────────────────────────────────────────────────────
// export function useOrders(params?: {
//   page?: number;
//   limit?: number;
//   waiter_id?: string;
//   status?: string;
//   business_day_id?: string;
//   shift_id?: string;
//   table_number?: string;
//   outlet?: 'restaurant' | 'bar' | 'both';
//   approval_status?: 'pending' | 'approved' | 'rejected';
// }) {
//   return useQuery({
//     queryKey: ['orders', params],
//     queryFn: () => listOrders(params),
//   });
// }

// export function useOrder(id: string | undefined) {
//   return useQuery({
//     queryKey: ['order', id],
//     queryFn: () => getOrder(id!),
//     enabled: !!id,
//   });
// }

// export function useCreateOrder() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: createOrder,
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['orders'] });
//     },
//   });
// }

// export function useAddOrderLine(orderId: string) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: { menu_item_id: string; quantity: number; notes?: string }) =>
//       addOrderLine(orderId, data),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['order', orderId] });
//       qc.invalidateQueries({ queryKey: ['orders'] });
//     },
//   });
// }

// export function useGenerateBill(orderId: string) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: () => generateBill(orderId),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['order', orderId] });
//       qc.invalidateQueries({ queryKey: ['orders'] });
//       qc.invalidateQueries({ queryKey: ['bills'] });
//     },
//   });
// }

// // ─── Bills ──────────────────────────────────────────────────────────
// export function useBills(params?: {
//   page?: number;
//   limit?: number;
//   waiter_id?: string;
//   status?: string;
//   business_day_id?: string;
// }) {
//   return useQuery({
//     queryKey: ['bills', params],
//     queryFn: () => listBills(params),
//   });
// }

// export function useBill(id: string | undefined) {
//   return useQuery({
//     queryKey: ['bill', id],
//     queryFn: () => getBill(id!),
//     enabled: !!id,
//   });
// }

// export function useApplyDiscount(billId: string) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: { amount: number; reason: string }) =>
//       applyDiscount(billId, data),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['bill', billId] });
//       qc.invalidateQueries({ queryKey: ['bills'] });
//     },
//   });
// }







import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listOrders,
  getOrder,
  createOrder,
  addOrderLine,
  generateBill,
  listBills,
  getBill,
  applyDiscount,
  listBarPending,
  issueBarLine,
} from '@/lib/api/orders';

// ─── Orders ─────────────────────────────────────────────────────────
export function useOrders(params?: ListFilters & {
  page?: number;
  limit?: number;
  waiter_id?: string;
  status?: string;
  business_day_id?: string;
  shift_id?: string;
  table_number?: string;
  outlet?: 'restaurant' | 'bar' | 'both';
  approval_status?: 'pending' | 'approved' | 'rejected';
}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => listOrders(params),
    refetchInterval: 10000,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    refetchInterval: 8000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAddOrderLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      menu_item_id: string;
      quantity: number;
      notes?: string;
    }) => addOrderLine(orderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      // New drinks show on the bar's list straight away
      qc.invalidateQueries({ queryKey: ['bar-pending'] });
    },
  });
}

export function useGenerateBill(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => generateBill(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

// ─── Bills ──────────────────────────────────────────────────────────
export function useBills(params?: ListFilters & {
  page?: number;
  limit?: number;
  waiter_id?: string;
  status?: string;
  business_day_id?: string;
}, enabled = true) {
  return useQuery({
    queryKey: ['bills', params],
    queryFn: () => listBills(params),
    enabled,
    refetchInterval: 20000,
  });
}

export function useBill(id: string | undefined) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: () => getBill(id!),
    enabled: !!id,
  });
}

export function useApplyDiscount(billId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; reason: string }) =>
      applyDiscount(billId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bill', billId] });
      qc.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

// ─── Bar Issuing ────────────────────────────────────────────────────
export function useBarPending(page = 1, limit = 50, enabled = true) {
  return useQuery({
    queryKey: ['bar-pending', page, limit],
    queryFn: () => listBarPending({ page, limit }),
    enabled,
    // Close to live: drinks ordered on another phone appear within a few seconds
    refetchInterval: 5000,
  });
}

export function useIssueBarLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderLineId: string) => issueBarLine(orderLineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bar-pending'] });
      qc.invalidateQueries({ queryKey: ['bar-stock'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}