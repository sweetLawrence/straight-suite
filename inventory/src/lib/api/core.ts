import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── Properties ─────────────────────────────────────────────────────
export interface Property {
  id: string;
  code: string;
  name: string;
  location: string | null;
  property_type: string;
  parent_group_id: string | null;
  timezone: string;
  status: string;
}

export async function listProperties(params?: { page?: number; limit?: number }) {
  const res = await apiClient.get<PaginatedResponse<Property>>('/properties', { params });
  return res.data;
}

export async function getProperty(id: string) {
  const res = await apiClient.get<ApiResponse<Property>>(`/properties/${id}`);
  return res.data.data;
}


export async function listTransferTargets() {
  const res = await apiClient.get<ApiResponse<Property[]>>(
    '/properties/transfer-targets'
  );
  return res.data.data;
}

// ─── Users ──────────────────────────────────────────────────────────
export interface UserListItem {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  primary_property_id: string | null;
  status: string;
 user_roles?: Array<{
  id: string;
  role: { id: string; code: string; name: string };
  property?: { id: string; code: string } | null;
}>;
}

export async function listUsers(params?: { page?: number; limit?: number; role?: string; status?: string }) {
  const res = await apiClient.get<PaginatedResponse<UserListItem>>('/users', { params });
  return res.data;
}

export async function getUser(id: string) {
  const res = await apiClient.get<ApiResponse<UserListItem>>(`/users/${id}`);
  return res.data.data;
}

// ─── Business Days ──────────────────────────────────────────────────
export interface BusinessDay {
  id: string;
  property_id: string;
  business_date: string;
  opened_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
}

export async function listBusinessDays(params?: { page?: number; limit?: number; status?: string }) {
  const res = await apiClient.get<PaginatedResponse<BusinessDay>>('/business-days', { params });
  return res.data;
}

export async function getCurrentBusinessDay() {
  const res = await apiClient.get<ApiResponse<BusinessDay>>('/business-days/current');
  return res.data.data;
}

// ─── Shifts ─────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  property_id: string;
  business_day_id: string;
  code: string;
  name: string;
  opened_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
}

export async function listShifts(params?: { page?: number; limit?: number; status?: string }) {
  const res = await apiClient.get<PaginatedResponse<Shift>>('/shifts', { params });
  return res.data;
}

export async function getCurrentShift() {
  const res = await apiClient.get<ApiResponse<Shift>>('/shifts/current');
  return res.data.data;
}

// ─── Roles & Permissions ────────────────────────────────────────────
export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export async function listRoles() {
  const res = await apiClient.get<PaginatedResponse<Role>>('/roles');
  return res.data;
}

export interface Permission {
  id: string;
  code: string;
  description: string | null;
}

export async function listPermissions() {
  const res = await apiClient.get<PaginatedResponse<Permission>>('/permissions');
  return res.data;
}





export async function createUser(data: {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  phone?: string;
  primary_property_id?: string;
  role_codes?: string[];
}) {
  const res = await apiClient.post<ApiResponse<UserListItem>>('/users', data);
  return res.data.data;
}

export async function updateUser(
  id: string,
  data: {
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    status?: 'active' | 'inactive' | 'suspended';
    password?: string;
  }
) {
  const res = await apiClient.patch<ApiResponse<UserListItem>>(
    `/users/${id}`,
    data
  );
  return res.data.data;
}

export async function assignUserRole(
  userId: string,
  data: { role_code: string; property_id?: string }
) {
  const res = await apiClient.post<ApiResponse<UserListItem>>(
    `/users/${userId}/roles`,
    data
  );
  return res.data.data;
}

export async function revokeUserRole(userId: string, roleId: string) {
  const res = await apiClient.delete<ApiResponse<UserListItem>>(
    `/users/${userId}/roles/${roleId}`
  );
  return res.data.data;
}

export async function updateProperty(
  id: string,
  data: {
    name?: string;
    location?: string | null;
    property_type?: string;
    timezone?: string;
    status?: string;
  }
) {
  const res = await apiClient.patch<ApiResponse<Property>>(
    `/properties/${id}`,
    data
  );
  return res.data.data;
}