import axios, { AxiosError } from 'axios';
import { appPath, pagePath } from '@/lib/utils/basePath';

const LIVE_API = import.meta.env.VITE_API_URL || 'https://straight-group-inventory-bcyu.onrender.com';

// Opened on this computer (or on a phone over the same wifi): talk to the backend on port 4000.
// Anywhere else (the real site) it uses the live backend.
const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocal = host === 'localhost' || host === '127.0.0.1' || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
const API_URL = isLocal ? `${window.location.protocol}//${host}:5000` : LIVE_API;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// ─── Request interceptor: attach token ──────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
    // The administrator working at one property (the server only honours this for admins)
    try {
      const acting = localStorage.getItem('acting_property');
      const roles = JSON.parse(localStorage.getItem('auth_user') || '{}')?.roles as { code: string }[] | undefined;
      if (acting && roles?.some((r) => r.code === 'admin')) (config.headers as any)['X-Property-Id'] = acting;
    } catch {
      /* ignore */
    }
  }
  return config;
});

// ─── Response interceptor: handle 401 ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Redirect to login if not already there
      if (!['/login', '/admin-login'].includes(pagePath())) {
        window.location.href = appPath(pagePath().startsWith('/admin') ? '/admin-login' : '/login');
      }
    }
    return Promise.reject(error);
  }
);

// ─── Typed response shapes ─────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: Array<{ path: string; message: string }>;
}

// ─── Helper for extracting error message ────────────────────────────
// "Validation isIn on exception_type failed" → "Exception type: choose one of the listed options"
function friendlyDetail(d: { path?: string | (string | number)[]; message?: string }): string {
  const field = String(Array.isArray(d.path) ? d.path.join('.') : d.path || '')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
  const msg = String(d.message || '');
  const m = msg.match(/^Validation (\w+) on (\w+) failed$/);
  if (m) {
    const what = m[1] === 'isIn' ? 'choose one of the listed options' : 'is not valid';
    return `${field || m[2].replace(/_/g, ' ')}: ${what}`;
  }
  return field && !msg.toLowerCase().startsWith(field.toLowerCase()) ? `${field}: ${msg}` : msg;
}

/**
 * A message fit to show the user. `fallback` is used when the server gives no
 * reason (e.g. the network is down), e.g. "Failed to load slips".
 */
export function getErrorMessage(err: unknown, fallback?: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    // Don't show internal permission codes to users
    if (err.response?.status === 403) {
      return "You don't have access to this. Ask a manager if you need it.";
    }
    if (!err.response) {
      return `${fallback ? fallback + '. ' : ''}Check your connection and try again.`;
    }
    if (data?.details && data.details.length > 0) {
      return data.details.map(friendlyDetail).join(', ');
    }
    if (data?.error) return data.error;
    return fallback || err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback || 'Something went wrong';
}