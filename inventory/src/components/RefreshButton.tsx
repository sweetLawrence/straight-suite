import { useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { RotateCw } from 'lucide-react';

/**
 * Reload the whole app, for the installed (PWA) version where there is no browser
 * refresh. Also asks the service worker for a newer version first, so a fresh
 * deploy shows up straight away.
 */
export function RefreshButton({ color = '#495057', size = 40 }: { color?: string; size?: number }) {
  const [busy, setBusy] = useState(false);
  const reload = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker?.getRegistration?.();
      await reg?.update();
      reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      // No service worker (or offline): a plain reload still helps
    }
    window.location.reload();
  };
  return (
    <Tooltip label="Refresh" withArrow>
      <ActionIcon variant="subtle" size={size} radius="xl" onClick={reload} aria-label="Refresh" style={{ color, flexShrink: 0 }}>
        <RotateCw size={19} strokeWidth={1.9} style={busy ? { animation: 'spin 0.8s linear infinite' } : undefined} />
      </ActionIcon>
    </Tooltip>
  );
}
