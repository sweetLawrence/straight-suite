import { useEffect, useRef, useState } from 'react';
import { Button, Group, Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Printer } from 'lucide-react';
import { BASE } from '@/lib/utils/basePath';

const EVENT = 'open-print';

/** True when a print page is shown inside the print window (no auto print, no own toolbar). */
export const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('embed');
if (isEmbed && typeof document !== 'undefined') {
  const st = document.createElement('style');
  st.textContent = '.no-print { display: none !important; } body { background: #fff !important; }';
  document.head.appendChild(st);
}

/** Open a print page in a window on top of the current screen. The person presses Print from there. */
export function openPrint(url: string, title = 'Print') {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { url, title } }));
}

export function PrintHost() {
  const [job, setJob] = useState<{ url: string; title: string } | null>(null);
  const [ready, setReady] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const small = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const on = (e: Event) => {
      setReady(false);
      setJob((e as CustomEvent).detail);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  const src = job ? `${BASE}${job.url}${job.url.includes('?') ? '&' : '?'}embed=1` : '';
  return (
    <Modal
      opened={!!job}
      onClose={() => setJob(null)}
      title={job?.title}
      size="xl"
      fullScreen={!!small}
      centered
      padding="sm"
    >
      <Group justify="flex-end" mb="xs">
        <Button leftSection={<Printer size={16} />} color="#0f766e" disabled={!ready} onClick={() => frame.current?.contentWindow?.print()}>
          Print
        </Button>
      </Group>
      {job && (
        <iframe
          ref={frame}
          title="Print preview"
          src={src}
          onLoad={() => setTimeout(() => setReady(true), 700)}
          style={{ width: '100%', height: small ? 'calc(100vh - 130px)' : '70vh', border: '1px solid #DEE2E6', borderRadius: 8, background: '#fff' }}
        />
      )}
    </Modal>
  );
}
