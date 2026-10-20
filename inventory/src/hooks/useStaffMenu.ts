import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listStaffMenuWeeks,
  getStaffMenuWeek,
  upsertStaffMenuSlot,
  lockStaffMenuWeek,
  unlockStaffMenuWeek,
  deleteStaffMenuWeek,
   getStandingMenu,
  upsertStandingSlot,
  lockStandingMenu,
  unlockStandingMenu,
} from '@/lib/api/staffMenu';



export function useStaffMenuWeeks(params?: {
  property_id?: string;
  status?: 'draft' | 'locked';
}) {
  return useQuery({
    queryKey: ['staff-menu-weeks', params],
    queryFn: () => listStaffMenuWeeks(params),
  });
}

export function useStaffMenuWeek(
  weekStart: string | undefined,
  params?: { property_id?: string }
) {
  return useQuery({
    queryKey: ['staff-menu-week', weekStart, params],
    queryFn: () => getStaffMenuWeek(weekStart!, params),
    enabled: !!weekStart,
  });
}

export function useUpsertStaffMenuSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      weekStart,
      dayOfWeek,
      mealType,
      data,
    }: {
      weekStart: string;
      dayOfWeek: number;
      mealType: 'breakfast' | 'lunch' | 'supper';
      data: Parameters<typeof upsertStaffMenuSlot>[3];
    }) => upsertStaffMenuSlot(weekStart, dayOfWeek, mealType, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['staff-menu-week', vars.weekStart] });
      qc.invalidateQueries({ queryKey: ['staff-menu-weeks'] });
    },
  });
}

export function useLockStaffMenuWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      weekStart,
      params,
    }: {
      weekStart: string;
      params?: { property_id?: string };
    }) => lockStaffMenuWeek(weekStart, params),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['staff-menu-week', vars.weekStart] });
      qc.invalidateQueries({ queryKey: ['staff-menu-weeks'] });
    },
  });
}

export function useUnlockStaffMenuWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      weekStart,
      params,
    }: {
      weekStart: string;
      params?: { property_id?: string };
    }) => unlockStaffMenuWeek(weekStart, params),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['staff-menu-week', vars.weekStart] });
      qc.invalidateQueries({ queryKey: ['staff-menu-weeks'] });
    },
  });
}

export function useDeleteStaffMenuWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      weekStart,
      params,
    }: {
      weekStart: string;
      params?: { property_id?: string };
    }) => deleteStaffMenuWeek(weekStart, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-menu-weeks'] });
    },
  });
}



export function useStandingMenu(params?: { property_id?: string }) {
  return useQuery({
    queryKey: ['staff-menu-standing', params],
    queryFn: () => getStandingMenu(params),
  });
}

export function useUpsertStandingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      dayOfWeek,
      mealType,
      data,
    }: {
      dayOfWeek: number;
      mealType: 'breakfast' | 'lunch' | 'supper';
      data: Parameters<typeof upsertStandingSlot>[2];
    }) => upsertStandingSlot(dayOfWeek, mealType, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-menu-standing'] });
    },
  });
}

export function useLockStandingMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lockStandingMenu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-menu-standing'] });
    },
  });
}

export function useUnlockStandingMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unlockStandingMenu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-menu-standing'] });
    },
  });
}