import { apiClient, ApiResponse } from '@/lib/api/client';

/** Web push needs a service worker, the Notification API and HTTPS (localhost counts). */
export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const toKey = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Ask permission, subscribe this device and tell the server. Returns an error message or null. */
export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return 'This browser cannot receive push alerts. On iPhone, add the app to the home screen first.';
  const key = (await apiClient.get<ApiResponse<{ key: string | null }>>('/push/key')).data.data.key;
  if (!key) return 'Push is not switched on at the server yet (VAPID keys missing).';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'Alerts are blocked. Allow notifications for this site in the browser settings.';
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) }));
  await apiClient.post('/push/subscribe', { subscription: sub.toJSON() });
  return null;
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await apiClient.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
}

export interface PushTest {
  library: boolean; public_key: boolean; private_key: boolean; ready: boolean; devices: number;
  results: { host: string; ok: boolean; status?: number | null; error?: string }[];
}

/** Sends a real test to every device this person has switched on, and says what went wrong if it fails */
export async function testPush(): Promise<string> {
  const r = (await apiClient.post<ApiResponse<PushTest>>('/push/test')).data.data;
  if (!r.library) return 'Server is missing the web-push package. Run npm install on the backend.';
  if (!r.public_key || !r.private_key) return `Server keys missing: ${!r.public_key ? 'VAPID_PUBLIC_KEY ' : ''}${!r.private_key ? 'VAPID_PRIVATE_KEY' : ''}`.trim();
  if (!r.devices) return 'Server has no device saved for you. Turn alerts off, then on again.';
  const bad = r.results.filter((x) => !x.ok);
  if (!bad.length) return `Test sent to ${r.devices} device(s). If nothing shows, check the phone or computer's notification settings.`;
  return bad.map((x) => `${x.host}: ${x.status ?? ''} ${x.error ?? ''}`).join(' | ');
}
