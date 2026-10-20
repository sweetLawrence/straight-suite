import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editOrderLine, recordHouseUse, removeOrderLine, voidBill, type StockAction } from '@/lib/api/orderEdit';

// Anything that moves stock or money: refresh the lists that show it
const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  ['order', 'orders', 'bill', 'bills', 'bar-stock', 'bar-movements', 'bar-pending', 'ledger', 'ledger-summary', 'notifications', 'unread-count', 'waste', 'payments'].forEach((k) =>
    qc.invalidateQueries({ queryKey: [k] })
  );
};

export function useEditOrderLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { lineId: string; quantity: number; reason: string; stock_action: StockAction }) =>
      editOrderLine(orderId, v.lineId, { quantity: v.quantity, reason: v.reason, stock_action: v.stock_action }),
    onSuccess: () => refresh(qc),
  });
}

export function useRemoveOrderLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { lineId: string; reason: string; stock_action: StockAction }) =>
      removeOrderLine(orderId, v.lineId, { reason: v.reason, stock_action: v.stock_action }),
    onSuccess: () => refresh(qc),
  });
}

export function useVoidBill(billId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { reason: string; stock_action: StockAction }) => voidBill(billId, v),
    onSuccess: () => refresh(qc),
  });
}

export function useRecordHouseUse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordHouseUse,
    onSuccess: () => refresh(qc),
  });
}
