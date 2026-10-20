import { apiClient, ApiResponse } from './client';

export interface RoomType { id: string; property_id: string; name: string; bb_price: number; hb_price: number; fb_price: number; note: string | null }
export type MealPlan = 'bb' | 'hb' | 'fb';
export const PLAN_LABEL: Record<MealPlan, string> = { bb: 'Bed & Breakfast', hb: 'Half Board', fb: 'Full Board' };

export async function listRoomTypes(propertyId?: string) {
  const res = await apiClient.get<ApiResponse<RoomType[]>>('/room-types', { params: { property_id: propertyId } });
  return res.data.data;
}

export async function saveRoomType(v: { id?: string; name: string; bb_price: number; hb_price: number; fb_price: number; note?: string | null; property_id?: string; status?: 'active' | 'retired' }) {
  const { id, ...body } = v;
  const res = id ? await apiClient.patch<ApiResponse<RoomType>>(`/room-types/${id}`, body) : await apiClient.post<ApiResponse<RoomType>>('/room-types', body);
  return res.data.data;
}
