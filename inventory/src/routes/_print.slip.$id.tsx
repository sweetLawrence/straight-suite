// import { createFileRoute } from '@tanstack/react-router'
// import { useEffect } from 'react'
// import { Button, Group, Loader } from '@mantine/core'
// import { Printer } from 'lucide-react'
// import { useSlip } from '@/hooks/useStore'
// import { formatDateTime } from '@/lib/utils/format'

// export const Route = createFileRoute('/_print/slip/$id')({
//   component: SlipPrintPage
// })

// function SlipPrintPage () {
//   const { id } = Route.useParams()
//   const query = useSlip(id)

//   useEffect(() => {
//     if (query.data) {
//       const t = setTimeout(() => window.print(), 300)
//       return () => clearTimeout(t)
//     }
//   }, [query.data])

//   if (query.isLoading) {
//     return (
//       <Group justify='center' mt='xl'>
//         <Loader />
//       </Group>
//     )
//   }
//   if (query.error || !query.data) return <div>Slip not found</div>

//   const slip = query.data
//   const lines = slip.issue_slip_lines ?? []

//   return (
//     <>
//       <Group
//         justify='space-between'
//         p='md'
//         style={{ borderBottom: '1px solid #eaeaea' }}
//         className='no-print'
//       >
//         <span>Slip {slip.slip_ref}</span>
//         <Button
//           leftSection={<Printer size={16} />}
//           onClick={() => window.print()}
//         >
//           Print again
//         </Button>
//       </Group>

//       <div className='slip'>
//         <div className='slip-header'>
//           <div className='slip-title'>KITCHEN ISSUE SLIP</div>
//           <div className='slip-sub'>{slip.slip_ref}</div>
//           <div className='slip-sub'>
//             {slip.property?.name} · {formatDateTime(slip.printed_at)}
//           </div>
//         </div>

//         <div className='slip-block'>
//           <div>
//             <strong>Table:</strong> {slip.order?.table_number || '-'}
//           </div>
//           <div>
//             <strong>Order:</strong> {slip.order?.order_ref}
//           </div>
//           <div>
//             <strong>Customer:</strong> {slip.order?.customer_code}
//           </div>
//           <div>
//             <strong>Waiter:</strong> {slip.order?.waiter?.full_name || '-'}
//           </div>
//         </div>

//         <table className='slip-lines'>
//           <thead>
//             <tr>
//               <th style={{ width: '15%' }}>QTY</th>
//               <th style={{ width: '85%' }}>ITEM</th>
//             </tr>
//           </thead>
//           <tbody>
//             {lines.map(l => (
//               <tr key={l.id}>
//                 <td className='center'>
//                   {parseFloat(l.order_line?.quantity || '1')}
//                 </td>
//                 <td>
//                   <div className='item-name'>
//                     {l.order_line?.menu_item?.display_name || '-'}
//                   </div>
//                   <div className='item-sub'>
//                     → {parseFloat(l.quantity)} {l.unit?.code || ''} of{' '}
//                     {l.stock_item?.item?.name}
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <div className='slip-footer'>
//           <div>Printed by: {slip.printed_by_user?.full_name}</div>
//           {slip.reprint_count > 0 && <div>Reprint #{slip.reprint_count}</div>}
//           <div className='signature'>Received by: ______________________</div>
//           <div className='signature'>Time: ______________________</div>
//         </div>
//       </div>
//     </>
//   )
// }

import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button, Group, Loader } from '@mantine/core'
import { Printer } from 'lucide-react'
import { useSlip } from '@/hooks/useStore'
import { formatDateTime } from '@/lib/utils/format'

import { isEmbed } from '@/lib/print';

export const Route = createFileRoute('/_print/slip/$id')({
  component: SlipPrintPage
})

function SlipPrintPage () {
  const { id } = Route.useParams()
  const query = useSlip(id)

  useEffect(() => {
    if (query.data) {
      if (isEmbed) return
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [query.data])

  if (query.isLoading) {
    return (
      <Group justify='center' mt='xl'>
        <Loader />
      </Group>
    )
  }
  if (query.error || !query.data) return <div>Slip not found</div>

  const slip = query.data
  const lines = slip.issue_slip_lines ?? []
  const property = slip.property

  // Group lines by menu item (order_line.menu_item.id)
  const grouped = lines.reduce((acc, line) => {
    const menuItemId = line.order_line?.menu_item?.id || 'unknown'
    const menuItemName =
      line.order_line?.menu_item?.display_name || 'Unknown item'
    const menuQty = parseFloat(line.order_line?.quantity || '0')

    if (!acc[menuItemId]) {
      acc[menuItemId] = {
        menu_item_name: menuItemName,
        menu_qty: menuQty,
        lines: []
      }
    }
    acc[menuItemId].lines.push(line)
    return acc
  }, {} as Record<string, { menu_item_name: string; menu_qty: number; lines: typeof lines }>)

  const groupedList = Object.values(grouped)

  return (
    <>
      {/* Screen-only toolbar */}
      <Group
        justify='space-between'
        p='md'
        style={{ borderBottom: '1px solid #eaeaea' }}
        className='no-print'
      >
        <span>Slip {slip.slip_ref}</span>
        <Button
          leftSection={<Printer size={16} />}
          onClick={() => window.print()}
        >
          Print again
        </Button>
      </Group>

      {/* The slip */}
      <div className='slip'>
        {/* ── Property header ── */}
        <div className='slip-header'>
          {property?.logo_url && (
            <img
              src={property.logo_url}
              alt={property.name}
              className='slip-logo'
            />
          )}
          <div className='slip-property-name'>
            {(property?.name || 'PROPERTY').toUpperCase()}
          </div>
          {property?.address && (
            <div className='slip-property-sub'>{property.address}</div>
          )}
          {property?.phone && (
            <div className='slip-property-sub'>Tel: {property.phone}</div>
          )}
          {property?.kra_pin && (
            <div className='slip-property-sub'>PIN: {property.kra_pin}</div>
          )}
          <div className='slip-title'>KITCHEN ISSUE SLIP</div>
          <div className='slip-ref'>{slip.slip_ref}</div>
        </div>

        {/* ── Meta block ── */}
        <div className='slip-meta'>
          <div className='slip-meta-row'>
            <span className='slip-meta-label'>Table:</span>
            <span className='slip-meta-value'>
              {slip.order?.table_number || '-'}
            </span>
          </div>
          <div className='slip-meta-row'>
            <span className='slip-meta-label'>Order:</span>
            <span className='slip-meta-value'>
              {slip.order?.order_ref || '-'}
            </span>
          </div>
          <div className='slip-meta-row'>
            <span className='slip-meta-label'>Customer:</span>
            <span className='slip-meta-value'>
              {slip.order?.customer_code || '-'}
            </span>
          </div>
          <div className='slip-meta-row'>
            <span className='slip-meta-label'>Waiter:</span>
            <span className='slip-meta-value'>
              {slip.order?.waiter?.full_name || '-'}
            </span>
          </div>
          <div className='slip-meta-row'>
            <span className='slip-meta-label'>Time:</span>
            <span className='slip-meta-value'>
              {formatDateTime(slip.printed_at)}
            </span>
          </div>
        </div>

        {/* ── Line items, grouped by menu item ── */}
        <div className='slip-lines'>
          {groupedList.map((group, idx) => (
            <div key={idx} className='slip-group'>
              <div className='slip-group-header'>
                {group.menu_item_name}
                {group.menu_qty > 1 && (
                  <span className='slip-group-qty'> × {group.menu_qty}</span>
                )}
              </div>
              {group.lines.find(l => l.notes) && (
                <div className='slip-group-note'>{group.lines.find(l => l.notes)?.notes}</div>
              )}
              <table className='slip-group-lines'>
                <tbody>
                  {group.lines.filter(l => l.stock_item).map(l => (
                    <tr key={l.id}>
                      <td className='slip-qty'>
                        {parseFloat(l.quantity).toFixed(
                          Number.isInteger(parseFloat(l.quantity)) ? 0 : 2
                        )}
                      </td>
                      <td className='slip-item'>
                        {l.stock_item?.item?.name || '-'}
                      </td>
                      <td className='slip-unit'>{l.unit?.code || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className='slip-footer'>
          <div className='slip-footer-line'>
            Printed by: {slip.printed_by_user?.full_name || '-'}
          </div>
          {slip.reprint_count > 0 && (
            <div className='slip-footer-line'>
              *** REPRINT #{slip.reprint_count} ***
            </div>
          )}

          <div className='slip-signature'>
            <div className='slip-signature-line'>
              Received by: ______________________
            </div>
            <div className='slip-signature-line'>
              Time: ______________________
            </div>
          </div>
        </div>

        <div className='slip-end'>- END OF SLIP -</div>
      </div>
    </>
  )
}
