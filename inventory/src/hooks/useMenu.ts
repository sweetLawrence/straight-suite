import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  listPortionDefinitions,
  getMenuItem as _getMenuItem,
  createPortionDefinition,
  updatePortionDefinition,
  listRecipes,
  createRecipe,
  updateRecipe,
  listItems,
  listUnits,
} from '@/lib/api/menu';

// ─── MENU ITEMS ─────────────────────────────────────────────────────
export function useMenuItemsList(params?: {
  page?: number;
  limit?: number;
  category?: string;
  station?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['menu-items', params],
    queryFn: () => listMenuItems(params),
  });
}

export function useMenuItemDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => getMenuItem(id!),
    enabled: !!id,
  });
}



export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}



export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateMenuItem>[1];
    }) => updateMenuItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

// ─── PORTION DEFINITIONS ────────────────────────────────────────────
export function usePortionDefinitionsList(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
}) {
  return useQuery({
    queryKey: ['portion-definitions', params],
    queryFn: () => listPortionDefinitions(params),
  });
}

export function useCreatePortionDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPortionDefinition,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portion-definitions'] });
    },
  });
}

export function useUpdatePortionDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updatePortionDefinition>[1];
    }) => updatePortionDefinition(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portion-definitions'] });
    },
  });
}

// ─── RECIPES ────────────────────────────────────────────────────────
export function useRecipesList(params?: {
  page?: number;
  limit?: number;
  menu_item_id?: string;
  stock_item_id?: string;
}) {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => listRecipes(params),
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateRecipe>[1];
    }) => updateRecipe(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

// ─── REFERENCE ──────────────────────────────────────────────────────
export function useItemsList(params?: {
  page?: number;
  limit?: number;
  item_type?: string;
}) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => listItems(params),
  });
}

export function useUnitsList() {
  return useQuery({
    queryKey: ['units'],
    queryFn: () => listUnits({ limit: 100 }),
  });
}