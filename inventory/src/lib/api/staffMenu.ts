import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface StaffMenuScheduleItem {
  id: string;
  schedule_id: string;
  stock_item_id: string;
  quantity: string;
  unit_id: string;
  notes: string | null;
  stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
    stock_model?: string;
  };
  unit?: { id: string; code: string; name: string };
}

export interface StaffMenuSchedule {
  id: string;
  property_id: string;
  week_start_date: string;
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  status: 'draft' | 'locked';
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  items?: StaffMenuScheduleItem[];
  created_by_user?: { id: string; full_name: string };
  approved_by_user?: { id: string; full_name: string };
}

export interface WeekSummary {
  property_id: string;
  week_start_date: string;
  status: 'draft' | 'locked';
  slots_filled: number;
  statuses: { draft: number; locked: number };
}

export interface WeekGridCell {
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  schedule: StaffMenuSchedule | null;
}

export interface WeekGridDay {
  day_of_week: number;
  meals: WeekGridCell[];
}

export interface WeekResponse {
  property_id: string;
  week_start_date: string;
  grid: WeekGridDay[];
  schedules: StaffMenuSchedule[];
}

export async function listStaffMenuWeeks(params?: {
  property_id?: string;
  status?: 'draft' | 'locked';
}) {
  const res = await apiClient.get<ApiResponse<WeekSummary[]>>(
    '/staff-menu/weeks',
    { params }
  );
  return res.data.data;
}

export async function getStaffMenuWeek(
  weekStart: string,
  params?: { property_id?: string }
) {
  const res = await apiClient.get<ApiResponse<WeekResponse>>(
    `/staff-menu/weeks/${weekStart}`,
    { params }
  );
  return res.data.data;
}

export async function upsertStaffMenuSlot(
  weekStart: string,
  dayOfWeek: number,
  mealType: 'breakfast' | 'lunch' | 'supper',
  data: {
    property_id?: string;
    notes?: string | null;
    items: Array<{
      stock_item_id: string;
      quantity: number;
      unit_id: string;
      notes?: string | null;
    }>;
  }
) {
  const res = await apiClient.put<ApiResponse<WeekResponse>>(
    `/staff-menu/weeks/${weekStart}/day/${dayOfWeek}/meal/${mealType}`,
    data
  );
  return res.data.data;
}

export async function lockStaffMenuWeek(
  weekStart: string,
  params?: { property_id?: string }
) {
  const res = await apiClient.post<ApiResponse<any>>(
    `/staff-menu/weeks/${weekStart}/lock`,
    {},
    { params }
  );
  return res.data.data;
}

export async function unlockStaffMenuWeek(
  weekStart: string,
  params?: { property_id?: string }
) {
  const res = await apiClient.post<ApiResponse<any>>(
    `/staff-menu/weeks/${weekStart}/unlock`,
    {},
    { params }
  );
  return res.data.data;
}

export async function deleteStaffMenuWeek(
  weekStart: string,
  params?: { property_id?: string }
) {
  const res = await apiClient.delete<ApiResponse<{ deleted: number }>>(
    `/staff-menu/weeks/${weekStart}`,
    { params }
  );
  return res.data.data;
}


export async function getStandingMenu(params?: { property_id?: string }) {
  const res = await apiClient.get<ApiResponse<WeekResponse>>(
    '/staff-menu/standing',
    { params }
  );
  return res.data.data;
}

export async function upsertStandingSlot(
  dayOfWeek: number,
  mealType: 'breakfast' | 'lunch' | 'supper',
  data: {
    property_id?: string;
    notes?: string | null;
    items: Array<{
      stock_item_id: string;
      quantity: number;
      unit_id: string;
      notes?: string | null;
    }>;
  }
) {
  const res = await apiClient.put<ApiResponse<WeekResponse>>(
    `/staff-menu/standing/day/${dayOfWeek}/meal/${mealType}`,
    data
  );
  return res.data.data;
}

export async function lockStandingMenu(params?: { property_id?: string }) {
  const res = await apiClient.post<ApiResponse<any>>(
    '/staff-menu/standing/lock',
    {},
    { params }
  );
  return res.data.data;
}

export async function unlockStandingMenu(params?: { property_id?: string }) {
  const res = await apiClient.post<ApiResponse<any>>(
    '/staff-menu/standing/unlock',
    {},
    { params }
  );
  return res.data.data;
}