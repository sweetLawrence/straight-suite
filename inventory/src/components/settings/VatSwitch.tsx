import { useState } from 'react';
import { Badge, Button, Card, Group, Modal, Stack, Switch, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useSettings, useSetVat } from '@/hooks/useSettings';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { useIsMobile } from '@/hooks/useIsMobile';

/**
 * The business charges VAT or not. The MD switches it; everyone else sees which it is.
 * On: menu prices include VAT, which comes off revenue; events may add VAT on top; eTIMS sends VAT.
 * Off: no VAT anywhere; revenue is the full price.
 */
export function VatSwitch() {
  const auth = useAuth();
  const isMobile = useIsMobile();
  const canSet = auth.hasPermission('settings.vat');
  const q = useSettings();
  const setVat = useSetVat();
  const [asking, setAsking] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const s = q.data;
  if (!s) return null;
  const on = s.vat_registered;

  const save = () =>
    setVat.mutate(
      { on: asking!, reason: reason.trim() || undefined },
      {
        onSuccess: (r) => {
          notifications.show({ color: 'green', title: r.vat_registered ? 'VAT is on' : 'VAT is off', message: 'Every money figure has been worked out again.' });
          setAsking(null);
          setReason('');
        },
        onError: (err) => notifications.show({ color: 'red', title: 'Could not change VAT', message: getErrorMessage(err) }),
      },
    );

  return (
    <>
      <Card withBorder radius="md" p="sm" mb="md" style={{ borderColor: on ? '#A5D8FF' : '#FFD8A8', background: on ? '#F3F9FF' : '#FFF9F0' }}>
        <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Group gap={6}>
              <Text fw={700} size="sm">VAT</Text>
              <Badge size="sm" color={on ? '#1971C2' : '#E8590C'}>{on ? `On, ${s.vat_rate}%` : 'Off'}</Badge>
            </Group>
            <Text size="xs" c="#495057">
              {on
                ? `Menu prices include ${s.vat_rate}% VAT, taken off revenue. Events can add VAT on top. eTIMS sends VAT.`
                : 'The business does not charge VAT. Revenue is the full price; events cannot add VAT; eTIMS sends non-VAT.'}
              {canSet ? '' : ' Only the MD can change this.'}
            </Text>
          </Stack>
          {canSet && (
            <Switch size="md" color="#1971C2" checked={on} onChange={(e) => setAsking(e.currentTarget.checked)} aria-label="VAT on" />
          )}
        </Group>
      </Card>
      <Modal opened={asking !== null} onClose={() => setAsking(null)} title={asking ? 'Switch VAT on?' : 'Switch VAT off?'} centered fullScreen={isMobile}>
        <Stack gap="sm">
          <Text size="sm">
            {asking
              ? `From now on menu prices are treated as including ${s.vat_rate}% VAT. Revenue, profit, the VAT report, the journal and eTIMS all change for every month that is not closed.`
              : 'From now on there is no VAT: revenue is the full price, the VAT report shows nothing, and eTIMS sends sales as non-VAT. Every month that is not closed changes. Events already invoiced with VAT keep it.'}
          </Text>
          <Text size="xs" c="dimmed">Closed months keep the figures they were closed with. The MD and managers get an alert.</Text>
          <TextInput label="Why? (optional)" placeholder="e.g. VAT registration confirmed" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setAsking(null)}>Cancel</Button>
            <Button color={asking ? '#1971C2' : '#E8590C'} loading={setVat.isPending} onClick={save}>{asking ? 'Switch VAT on' : 'Switch VAT off'}</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
