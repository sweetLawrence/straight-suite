/**
 * Plain-language versions of audit events, for people rather than developers.
 * "payment.recorded" → "Payment recorded"; { total: 5000, methods: ['cash'] } →
 * "Amount: KES 5,000.00", "Methods: Cash".
 */


const AREA: Record<string, string> = {
  order: 'Orders',
  bill: 'Bills',
  payment: 'Payments',
  payment_line: 'Payments',
  cash: 'Cash',
  float: 'Cash',
  stock: 'Stock',
  store: 'Store',
  issue_slip: 'Store',
  transfer: 'Transfers',
  production: 'Production',
  staff_meal: 'Staff meals',
  staff_menu: 'Staff menu',
  waste: 'Stock',
  item: 'Menu & items',
  menu: 'Menu & items',
  product: 'Menu & items',
  variance_threshold: 'Production',
  user: 'Users',
  property: 'Settings',
  exception: 'Control',
  adjustment: 'Control',
  dispute: 'Control',
  reconciliation: 'Control',
  bulk_import: 'Settings',
  bar: 'Bar',
  business_day: 'Day & shift',
  shift: 'Day & shift'
}

export const AREA_OPTIONS = Object.entries(
  Object.entries(AREA).reduce<Record<string, string[]>>(
    (acc, [prefix, label]) => {
      ;(acc[label] = acc[label] || []).push(prefix)
      return acc
    },
    {}
  )
).map(([label, prefixes]) => ({ label, value: prefixes[0] }))

const words = (s: string) => s.replace(/_/g, ' ')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const eventArea = (type: string) =>
  AREA[String(type).split('.')[0]] || 'Other'

/** "payment.recorded" → "Payment recorded", "cash.drop_confirmed" → "Cash drop confirmed" */
export function eventLabel (type: string) {
  const [a, b] = String(type || '').split('.')
  return cap(b ? `${words(a)} ${words(b)}` : words(a))
}

const ACTION: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted'
}
export const actionLabel = (a?: string | null) =>
  a ? ACTION[a] || cap(words(a)) : '-'

const KEY_LABEL: Record<string, string> = {
  total: 'Amount',
  total_amount: 'Amount',
  amount: 'Amount',
  net_total: 'Net total',
  gross_total: 'Gross total',
  total_cost: 'Cost',
  cost_amount: 'Cost',
  received_qty: 'Quantity received',
  quantity: 'Quantity',
  outlet: 'Outlet',
  methods: 'Methods',
  method: 'Method',
  payment_ref: 'Payment',
  order_ref: 'Order',
  bill_ref: 'Bill',
  drop_ref: 'Cash drop',
  batch_ref: 'Batch',
  slip_ref: 'Issue slip',
  transfer_ref: 'Transfer',
  table_number: 'Table',
  customer_code: 'Tab',
  status: 'Status',
  reason: 'Reason',
  business_date: 'Business day',
  name: 'Name',
  menu_item: 'Menu item',
  receiver_role: 'Received as',
  packs_received: 'Packs received',
  pack_size: 'Pack size'
}

const MONEY_KEYS = new Set([
  'total',
  'total_amount',
  'amount',
  'net_total',
  'gross_total',
  'total_cost',
  'cost_amount',
  'bar_total'
])
const HIDE_KEYS = /(^id$|_id$|^ids$)/
const PRETTY_VALUE: Record<string, string> = {
  mpesa: 'M-Pesa',
  cash: 'Cash',
  card: 'Card',
  cheque: 'Cheque',
  house: 'House (MD)',
  other: 'Other',
  return: 'Back on the shelf',
  waste: 'Written off',
  restaurant: 'Restaurant',
  bar: 'Bar'
}

const kes = (n: number) =>
  `KES ${n.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

function prettyValue (key: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '-'
  if (Array.isArray(v)) {
    if (v.every(x => typeof x !== 'object'))
      return v.map(x => PRETTY_VALUE[String(x)] || String(x)).join(', ')
    return `${v.length} item${v.length === 1 ? '' : 's'}`
  }
  if (typeof v === 'object') return `${Object.keys(v as object).length} fields`
  if (MONEY_KEYS.has(key) && !Number.isNaN(Number(v))) return kes(Number(v))
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return PRETTY_VALUE[String(v)] || String(v)
}

/** Labelled, readable fields from a stored state object (ids hidden). */
export function describeState (
  state: unknown
): { label: string; value: string }[] {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return []
  return Object.entries(state as Record<string, unknown>)
    .filter(([k]) => !HIDE_KEYS.test(k))
    .map(([k, v]) => ({
      label: KEY_LABEL[k] || cap(words(k)),
      value: prettyValue(k, v)
    }))
}

/** The human reference in a state object, e.g. "PAY-MG-20261005-001". */
export function stateRef (state: unknown): string | null {
  if (!state || typeof state !== 'object') return null
  const s = state as Record<string, unknown>
  const ref =
    s.order_ref ||
    s.bill_ref ||
    s.payment_ref ||
    s.drop_ref ||
    s.batch_ref ||
    s.slip_ref ||
    s.transfer_ref ||
    s.code
  return ref ? String(ref) : null
}

/** One line: "PAY-MG-20261005-001 · KES 5,000.00 · Cash" */
export function eventSummary (state: unknown): string {
  if (!state || typeof state !== 'object') return ''
  const s = state as Record<string, unknown>
  const parts: string[] = []
  const ref = stateRef(s)
  if (ref) parts.push(ref)
  const amt =
    s.total_amount ?? s.total ?? s.amount ?? s.net_total ?? s.total_cost
  if (amt != null && !Number.isNaN(Number(amt))) parts.push(kes(Number(amt)))
  if (Array.isArray(s.methods))
    parts.push(s.methods.map(m => PRETTY_VALUE[String(m)] || m).join(' + '))
  if (s.table_number) parts.push(`Table ${s.table_number}`)
  if (s.menu_item) parts.push(String(s.menu_item))
  if (s.business_date) parts.push(`Business day ${s.business_date}`)
  return parts.join(' · ')
}

/** Where to open the record an event is about, when the app has a page for it. */
export function entityPath (type: string, id: string): string | null {
  const map: Record<string, string> = {
    order: `/orders/${id}`,
    bill: `/bills/${id}`,
    payment: `/payments/${id}`,
    cash_drop: `/cash-drops/${id}`,
    batch: `/stock/batches/${id}`,
    transfer: `/transfers/${id}`,
    production_batch: `/production/${id}`,
    waste_record: `/waste/${id}`,
    staff_meal: `/staff-meals/${id}`,
    exception: `/exceptions/${id}`,
    adjustment: `/adjustments/${id}`,
    dispute: `/disputes/${id}`,
    reconciliation_check: `/reconciliation/${id}`,
    stock_return: `/returns/${id}`
  }
  return map[type] || null
}
