import { useEtimsFor } from '@/hooks/useFinance';

/** KRA eTIMS details printed on a receipt or invoice once KRA has accepted it */
export function EtimsStamp({ type, id, compact = false }: { type: 'bill' | 'event'; id: string; compact?: boolean }) {
  const q = useEtimsFor(type, id);
  const e = q.data;
  if (!e) return null;
  const box = { marginTop: compact ? 8 : 18, padding: compact ? '6px 0' : '10px 12px', border: compact ? 'none' : '1px dashed #ADB5BD', borderTop: '1px dashed #ADB5BD', fontSize: compact ? 11 : 12, color: '#212529', lineHeight: 1.5 } as const;
  if (e.status !== 'sent') {
    return <div style={box}>KRA eTIMS: {e.status === 'failed' ? 'not yet accepted' : 'being sent'} (invoice {e.invc_no})</div>;
  }
  return (
    <div style={box}>
      <div style={{ fontWeight: 700 }}>KRA eTIMS</div>
      <div>CU serial: {e.sdc_id || '-'}</div>
      <div>CU invoice no: {e.rcpt_no}</div>
      {e.intrl_data && <div>Internal data: {e.intrl_data}</div>}
      {e.rcpt_sign && <div>Receipt signature: {e.rcpt_sign}</div>}
      <div>Total VAT: KES {e.tax_amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
    </div>
  );
}
