import { BOOKING_API, INVENTORY_API } from './config'

const SESSION = 'suite_session'
const TAB = 'suite_tab'

export type AppKey = 'bkg' | 'inv'

const get = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const set = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }
const del = (k: string) => { try { localStorage.removeItem(k) } catch { /* private mode */ } }

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.message || j.error?.message || `Failed (${r.status})`)
  return j
}

function jwtPayload(token: string): { role?: string; propertyId?: string } {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) } catch { return {} }
}

/** Each app reads its own saved login. We write it exactly as that app would after its own sign-in page. */
function seedInventory(res: { token: string; user: unknown }) {
  set('auth_token', res.token)
  set('auth_user', JSON.stringify(res.user))
}

function seedBookings(res: { data?: { accessToken: string; refreshToken: string } }) {
  const d = res.data
  if (!d) throw new Error('Unexpected reply')
  const p = jwtPayload(d.accessToken)
  set('booking-admin-auth', JSON.stringify({
    state: {
      accessToken: d.accessToken,
      refreshToken: d.refreshToken,
      role: p.role ?? null,
      userPropertyId: p.propertyId ?? null,
      selectedPropertyId: p.propertyId ?? null,
    },
    version: 0,
  }))
}

export interface SignInResult { name: string; problems: string[] }

/** One email + password, sent to both backends. Fails only when both refuse. */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const [inv, bkg] = await Promise.allSettled([
    post(`${INVENTORY_API}/auth/login`, { username: email, password }),
    post(`${BOOKING_API}/auth/login`, { email, password }),
  ])
  const problems: string[] = []
  if (inv.status === 'fulfilled') seedInventory(inv.value); else problems.push(`Inventory: ${inv.reason.message}`)
  if (bkg.status === 'fulfilled') seedBookings(bkg.value); else problems.push(`Bookings: ${bkg.reason.message}`)
  if (problems.length === 2) throw new Error(problems.join(' | '))
  const name = inv.status === 'fulfilled' ? inv.value.user.full_name : email
  set(SESSION, name)
  return { name, problems }
}

export function signedInName(): string | null {
  return get(SESSION) && (get('auth_token') || get('booking-admin-auth')) ? get(SESSION) : null
}

export function signOut() {
  ;['auth_token', 'auth_user', 'acting_property', 'booking-admin-auth', SESSION].forEach(del)
}

export const lastTab = (): AppKey => (get(TAB) === 'inv' ? 'inv' : 'bkg')
export const rememberTab = (t: AppKey) => set(TAB, t)
