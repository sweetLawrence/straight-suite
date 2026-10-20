import { Card, SegmentedControl, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useSettings, useSetSignedBill } from '@/hooks/useSettings';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';

/**
 * What happens when the MD signs a bill (no money collected).
 *   before: the bill stays open until the branch manager approves it.
 *   after:  the bill settles at once and the branch manager confirms it afterwards.
 */
export function SignedBillSwitch() {
  const auth = useAuth();
  const canSet = auth.hasPermission('settings.signed_bill');
  const q = useSettings();
  const set = useSetSignedBill();
  const s = q.data;
  if (!s) return null;
  const mode = s.signed_bill_approval ?? 'before';

  return (
    <Card withBorder radius="md" p="sm" mb="md" style={{ borderColor: '#FFC9C9', background: '#FFF5F5' }}>
      <Stack gap={6}>
        <Text fw={700} size="sm">Signed bills (MD, no bill)</Text>
        <Text size="xs" c="#495057">
          {mode === 'before'
            ? 'The bill stays open until the branch manager approves the signature.'
            : 'The bill settles at once. The branch manager confirms it afterwards.'}
          {canSet ? '' : ' Only the MD can change this.'}
        </Text>
        {canSet && (
          <SegmentedControl
            fullWidth
            value={mode}
            disabled={set.isPending}
            onChange={(v) =>
              set.mutate(
                { mode: v as 'before' | 'after' },
                {
                  onSuccess: () => notifications.show({ color: 'green', title: 'Saved', message: v === 'before' ? 'Signed bills now wait for the manager.' : 'Signed bills now settle first.' }),
                  onError: (err) => notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) }),
                },
              )
            }
            data={[
              { value: 'before', label: 'Manager approves first' },
              { value: 'after', label: 'Settle, then confirm' },
            ]}
          />
        )}
      </Stack>
    </Card>
  );
}
