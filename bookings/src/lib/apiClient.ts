import { useAuthStore } from '../stores/authStore'

// const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

const getBaseUrl = (): string => {
  // return import.meta.env.VITE_API_BASE_URL || 'https://straight-group.onrender.com/api/v1'
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
}

const BASE_URL = getBaseUrl()

export class ApiError extends Error {
  status: number
  code?: string
  constructor (message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  method?: string
  query?: Record<string, string | number | undefined | null>
  body?: unknown
  isForm?: boolean
  auth?: boolean
}

function buildUrl (path: string, query?: RequestOptions['query']) {
  let url = BASE_URL.replace(/\/$/, '') + path
  const parts = Object.entries(query || {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  )
  if (parts.length) {
    url +=
      '?' +
      parts
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
        )
        .join('&')
  }

  return url
}

async function rawRequest (path: string, opts: RequestOptions = {}) {
  const { accessToken } = useAuthStore.getState()
  const headers: Record<string, string> = {}
  if (opts.auth !== false && accessToken)
    headers.Authorization = `Bearer ${accessToken}`

  const fetchOpts: RequestInit = { method: opts.method || 'GET', headers }
  if (opts.isForm) {
    fetchOpts.body = opts.body as BodyInit
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    fetchOpts.body = JSON.stringify(opts.body)
  }

  const res = await fetch(buildUrl(path, opts.query), fetchOpts)
  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  return { status: res.status, data }
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh (): Promise<boolean> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState()
  if (!refreshToken) return false

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await rawRequest('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false
      })
      if (res.status === 200 && res.data?.success) {
        setTokens(res.data.data.accessToken, res.data.data.refreshToken)
        return true
      }
      logout()
      return false
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// export async function apiRequest<T = any> (
//   path: string,
//   opts: RequestOptions = {},
//   _retried = false
// ): Promise<T> {
//   const { status, data } = await rawRequest(path, opts)

//   if (status === 401 && opts.auth !== false && !_retried) {
//     const refreshed = await tryRefresh()
//     if (refreshed) return apiRequest<T>(path, opts, true)
//   }

//   if (!data || data.success !== true) {
//     throw new ApiError(
//       data?.error?.message || `Request failed (${status})`,
//       status,
//       data?.error?.code
//     )
//   }
//   return data.data as T
// }









async function performRequest(path: string, opts: RequestOptions = {}, _retried = false): Promise<any> {
  const { status, data } = await rawRequest(path, opts)

  if (status === 401 && opts.auth !== false && !_retried) {
    const refreshed = await tryRefresh()
    if (refreshed) return performRequest(path, opts, true)
  }

  if (!data || data.success !== true) {
    throw new ApiError(data?.error?.message || `Request failed (${status})`, status, data?.error?.code)
  }
  return data
}

export async function apiRequest<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const envelope = await performRequest(path, opts)
  return envelope.data as T
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; pageSize: number }
}

export async function apiRequestPaginated<T = any>(path: string, opts: RequestOptions = {}): Promise<PaginatedResponse<T>> {
  const envelope = await performRequest(path, opts)
  return { data: envelope.data as T[], meta: envelope.meta }
}