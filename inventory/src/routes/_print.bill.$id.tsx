import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button, Group, Loader } from '@mantine/core'
import { Printer } from 'lucide-react'
import { useBill } from '@/hooks/useOrders'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { EtimsStamp } from '@/components/finance/EtimsStamp'
import { useEtimsFor } from '@/hooks/useFinance'

import { isEmbed } from '@/lib/print'

export const Route = createFileRoute('/_print/bill/$id')({
  component: BillPrintPage
})

function BillPrintPage () {
  const { id } = Route.useParams()
  const query = useBill(id)

  // Wait for the eTIMS details so they are on the printout
  const etims = useEtimsFor('bill', id)

  useEffect(() => {
    if (query.data && !etims.isLoading) {
      if (isEmbed) return
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [query.data, etims.isLoading])

  if (query.isLoading) {
    return (
      <Group justify='center' mt='xl'>
        <Loader />
      </Group>
    )
  }
  if (query.error || !query.data) return <div>Bill not found</div>

  const bill = query.data
  const lines = bill.bill_lines ?? []
  const discounts = bill.discounts ?? []
  const payment = bill.payment
  const property = bill.property

  const isPaid = bill.status === 'paid' || bill.status === 'closed'

  return (
    <>
      {/* Screen-only toolbar */}
      <Group
        justify='space-between'
        p='md'
        style={{ borderBottom: '1px solid #eaeaea' }}
        className='no-print'
      >
        <span>Bill {bill.bill_ref}</span>
        <Button
          leftSection={<Printer size={16} />}
          onClick={() => window.print()}
        >
          Print again
        </Button>
      </Group>

      {/* The bill */}
      <div className='bill'>
        {/* ── Property header ── */}
        <div className='bill-header'>
          {property?.logo_url && (
            <img
              src={property.logo_url}
              alt={property.name}
              className='bill-logo'
            />
          )}
          <div className='bill-property-name'>
            {(property?.name || 'PROPERTY').toUpperCase()}
          </div>
          {property?.address && (
            <div className='bill-property-sub'>{property.address}</div>
          )}
          {property?.phone && (
            <div className='bill-property-sub'>Tel: {property.phone}</div>
          )}
          {property?.kra_pin && (
            <div className='bill-property-sub'>PIN: {property.kra_pin}</div>
          )}
          <div className='bill-doc-title'>{isPaid ? 'RECEIPT' : 'BILL'}</div>
          <div className='bill-ref'>{bill.bill_ref}</div>
        </div>

        {/* ── Meta block ── */}
        <div className='bill-meta'>
          <div className='bill-meta-row'>
            <span className='bill-meta-label'>Table:</span>
            <span className='bill-meta-value'>
              {bill.order?.table_number || '-'}
            </span>
          </div>
          <div className='bill-meta-row'>
            <span className='bill-meta-label'>Order:</span>
            <span className='bill-meta-value'>
              {bill.order?.order_ref || '-'}
            </span>
          </div>
          <div className='bill-meta-row'>
            <span className='bill-meta-label'>Customer:</span>
            <span className='bill-meta-value'>{bill.customer_code}</span>
          </div>
          <div className='bill-meta-row'>
            <span className='bill-meta-label'>Waiter:</span>
            <span className='bill-meta-value'>
              {bill.waiter?.full_name || '-'}
            </span>
          </div>
          <div className='bill-meta-row'>
            <span className='bill-meta-label'>Date:</span>
            <span className='bill-meta-value'>
              {formatDateTime(bill.opened_at)}
            </span>
          </div>
        </div>

        {/* ── Line items ── */}
        <table className='bill-lines'>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>QTY</th>
              <th style={{ width: '55%' }}>ITEM</th>
              <th style={{ width: '15%', textAlign: 'right' }}>PRICE</th>
              <th style={{ width: '20%', textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.id}>
                <td className='center'>
                  {parseFloat(l.quantity).toFixed(
                    Number.isInteger(parseFloat(l.quantity)) ? 0 : 2
                  )}
                </td>
                <td>{l.description}</td>
                <td className='right'>{formatCurrency(l.unit_price)}</td>
                <td className='right strong'>{formatCurrency(l.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals ── */}
        <div className='bill-totals'>
          <div className='bill-total-row'>
            <span>Subtotal</span>
            <span>{formatCurrency(bill.gross_total)}</span>
          </div>

          {discounts.map(d => (
            <div key={d.id} className='bill-total-row'>
              <span>
                Discount{' '}
                <span className='bill-discount-reason'>({d.reason})</span>
              </span>
              <span className='bill-negative'>-{formatCurrency(d.amount)}</span>
            </div>
          ))}

          <div className='bill-grand-total'>
            <span>TOTAL</span>
            <span>{formatCurrency(bill.net_total)}</span>
          </div>
        </div>

        {/* ── Payment block (only when paid) ── */}
        {isPaid && payment && (
          <div className='bill-payment'>
            <div className='bill-payment-title'>PAYMENT</div>
            {payment.payment_lines?.map(pl => (
              <div key={pl.id} className='bill-total-row'>
                <span>
                  {pl.method.toUpperCase()}
                  {pl.transaction_ref ? ` · ${pl.transaction_ref}` : ''}
                </span>
                <span>{formatCurrency(pl.amount)}</span>
              </div>
            ))}
            {payment.status !== 'verified' && (
              <div className='bill-payment-note'>Status: {payment.status}</div>
            )}
          </div>
        )}

        {/* ── KRA eTIMS ── */}
        {isPaid && <EtimsStamp type='bill' id={bill.id} compact />}

        {/* ── Footer ── */}
        <div className='bill-footer'>
          {!isPaid && (
            <div className='bill-footer-line'>
              <strong>Payment pending</strong>
            </div>
          )}
          <div className='bill-footer-line'>Thank you for your business</div>
          <div className='bill-footer-line bill-thanks-small'>
            Goods once sold are not returnable
          </div>
        </div>

        <div className='bill-end'>- END OF {isPaid ? 'RECEIPT' : 'BILL'} -</div>
      </div>
    </>
  )
}
