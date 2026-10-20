export interface SuiteConfig {
  url: string
  inventoryApi: string
  bookingApi: string
  localInventoryApi: string
  localBookingApi: string
}

declare global {
  interface Window {
    SUITE_CONFIG?: Partial<SuiteConfig>
    __TAURI__?: { core?: { invoke: (cmd: string) => Promise<unknown> } }
  }
}

const strip = (s?: string) => String(s || '').replace(/\/$/, '')

const c = window.SUITE_CONFIG || {}
const dev = ['localhost', '127.0.0.1'].includes(location.hostname)

export const SUITE_URL = strip(c.url)
export const INVENTORY_API = strip(dev ? c.localInventoryApi : c.inventoryApi)
export const BOOKING_API = strip(dev ? c.localBookingApi : c.bookingApi)

/** True only on the small built-in page of the Windows app (not on the website shown inside it) */
export const IS_APP_START_PAGE = location.protocol === 'tauri:' || location.hostname === 'tauri.localhost'
