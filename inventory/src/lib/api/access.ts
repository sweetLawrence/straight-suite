import { apiClient, ApiResponse } from './client';

export interface AccessRole {
  id: string; code: string; name: string; description: string | null;
  custom: boolean; locked: boolean; people: number;
  permissions: string[]; default_permissions: string[] | null;
}
export interface AccessOverview {
  customised: boolean;
  roles: AccessRole[];
  permissions: { code: string; description: string | null }[];
}
export interface PersonRow { id: string; full_name: string; username: string; roles: string[] }
export interface PersonAccess {
  person: { id: string; full_name: string; username: string };
  from_roles: string[]; grants: string[]; blocks: string[];
}

const B = '/admin/permissions';
const d = <T,>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

export const getAccess = () => d<AccessOverview>(apiClient.get(B));
export const saveRole = (code: string, permissions: string[]) => d<AccessOverview>(apiClient.put(`${B}/roles/${code}`, { permissions }));
export const createRole = (v: { name: string; description?: string; permissions: string[] }) => d<AccessOverview>(apiClient.post(`${B}/roles`, v));
export const resetRole = (code: string) => d<AccessOverview>(apiClient.post(`${B}/roles/${code}/reset`));
export const deleteRole = (code: string) => d<AccessOverview>(apiClient.delete(`${B}/roles/${code}`));
export const getPeople = (q: string) => d<PersonRow[]>(apiClient.get(`${B}/people`, { params: { q } }));
export const getPerson = (id: string) => d<PersonAccess>(apiClient.get(`${B}/people/${id}`));
export const savePerson = (id: string, grants: string[], blocks: string[]) => d<PersonAccess>(apiClient.put(`${B}/people/${id}`, { grants, blocks }));
