import { apiClient, ApiResponse } from './client';

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  primary_property_id: string | null;
  roles: Array<{
    code: string;
    property_id: string | null;
    property_code: string | null;
  }>;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(username: string, password: string) {
  const res = await apiClient.post<LoginResponse>('/auth/login', {
    username,
    password,
  });
  return res.data;
}

export async function fetchMe() {
  const res = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return res.data.data;
}