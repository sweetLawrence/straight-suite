import { useEffect, useState } from 'react';
import { Button, Card, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BellRing, BellOff } from 'lucide-react';
import { currentSubscription, disablePush, enablePush, pushSupported, testPush } from '@/lib/push';
import { getErrorMessage } from '@/lib/api/client';

/** One tap to get alerts on this phone or computer, even when the app is closed */
export function PushToggle() {
  const [on, setOn] = useState<boolean | null>(null);
  // Local testing only: put VITE_PUSH_TEST=true in frontend/.env.local. Never set on the live site.
  const canTest = import.meta.env.VITE_PUSH_TEST === 'true';
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let alive = true;
    currentSubscription()
      .then((s) => alive && setOn(!!s && Notification.permission === 'granted'))
      .catch(() => alive && setOn(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!pushSupported() || on === null) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disablePush();
        setOn(false);
      } else {
        const err = await enablePush();
        if (err) notifications.show({ color: 'orange', title: 'Alerts not on', message: err });
        else {
          setOn(true);
          notifications.show({ color: 'green', title: 'Alerts are on', message: 'You will get alerts on this device.' });
        }
      }
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not change', message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      notifications.show({ color: 'blue', title: 'Push test', message: await testPush(), autoClose: 12000 });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Test failed', message: getErrorMessage(err) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card withBorder radius="md" p="sm" mb="md" style={{ background: on ? '#EBFBEE' : '#FFF9DB', borderColor: on ? '#B2F2BB' : '#FFE066' }}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm" fw={600} style={{ color: '#343A40' }}>
          {on ? 'Alerts are on for this device' : 'Get alerts on this device, even when the app is closed'}
        </Text>
        <Group gap={6} wrap="nowrap">
        {on && canTest && (
          <Button size="compact-md" variant="default" loading={testing} onClick={test}>
            Send test
          </Button>
        )}
        <Button
          size="compact-md"
          color={on ? 'gray' : 'blue'}
          variant={on ? 'light' : 'filled'}
          loading={busy}
          leftSection={on ? <BellOff size={14} /> : <BellRing size={14} />}
          onClick={toggle}
        >
          {on ? 'Turn off' : 'Turn on'}
        </Button>
        </Group>
      </Group>
    </Card>
  );
}
