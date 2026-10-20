// Plain-language names for roles and permissions (shown on the dashboard).

export const ROLE_LABELS: Record<string, string> = {
  md: 'Managing Director',
  admin: 'Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
  store_manager: 'Store Manager',
  cashier: 'Cashier',
  waiter: 'Waiter',
  bar_attendant: 'Bar Attendant'
}

export const roleLabel = (code: string) =>
  ROLE_LABELS[code] ||
  code.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())

export const PERMISSION_LABELS: Record<string, string> = {
  'adjustment.approve': 'Approve stock and money adjustments',
  'bar.handover': 'Submit the bar handover',
  'bar.issue': 'Issue drinks from bar stock',
  'bar.order.approve': 'Approve large bar orders',
  'bar.order.create': 'Take bar orders',
  'bar.report.view': 'View bar reports and bar stock',
  'bar.verify': 'Verify the bar handover',
  'bill.discount': 'Give discounts on bills',
  'bill.transfer': 'Move bills between waiters',
  'cash.drop': 'Hand in cash (cash drops)',
  'cash.drop.verify': 'Confirm cash drops',
  'day.manage': 'Run the business day and shifts',
  'dispute.resolve': 'Resolve disputes',
  'exception.resolve': 'Resolve exceptions',
  'item.manage': 'Manage the item catalogue',
  'kitchen.slip.receive': 'Receive kitchen issue slips',
  'menu.manage': 'Manage menu, portions and recipes',
  'order.cancel': 'Cancel orders',
  'order.create': 'Take orders',
  'payment.record': 'Record payments',
  'payment.verify': 'Verify M-Pesa and card payments',
  'production.authorize': 'Authorise production and thresholds',
  'production.complete': 'Complete production batches',
  'production.create': 'Start production batches',
  'reconciliation.run': 'Run reconciliation checks',
  'report.view.group': 'View group reports (all properties)',
  'report.view.property': 'View property reports',
  'staff_meal.authorize': 'Authorise staff meals',
  'stock.bulk_issue': 'Bulk-issue stock',
  'stock.issue': 'Issue stock',
  'stock.item.manage': 'Manage stock items',
  'stock.portion': 'Portion batches',
  'stock.receive': 'Receive stock deliveries',
  'stock.return': 'Return stock to the store',
  'store.dispatch.create': 'Dispatch orders from the store',
  'store.queue.view': 'View the store dispatch queue',
  'transfer.approve': 'Approve transfers between properties',
  'user.manage': 'Manage users and roles'
}

export const permissionLabel = (code: string) => PERMISSION_LABELS[code] || code
