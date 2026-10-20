import { apiClient, ApiResponse } from './client';

export interface AppSettings { vat_registered: boolean; vat_rate: number; effective_vat_rate: number; signed_bill_approval: 'before' | 'after' }

export const getSettings = async () => (await apiClient.get<ApiResponse<AppSettings>>('/settings')).data.data;
export const setVat = async (body: { on: boolean; reason?: string }) => (await apiClient.put<ApiResponse<AppSettings>>('/settings/vat', body)).data.data;
export const setSignedBill = async (body: { mode: 'before' | 'after' }) => (await apiClient.put<ApiResponse<AppSettings>>('/settings/signed-bill', body)).data.data;
