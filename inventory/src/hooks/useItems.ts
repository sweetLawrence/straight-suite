import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  ItemType,
} from '@/lib/api/item';

export function useItems(params?: {
  page?: number;
  limit?: number;
  item_type?: ItemType;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => listItems(params),
  });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateItem>[1] }) =>
      updateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}