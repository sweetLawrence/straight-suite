import { useEffect, useRef, useState } from 'react';
import { Box, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { ScanLine } from 'lucide-react';

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/**
 * Scan a barcode with the phone camera (Chrome on Android), or type it /
 * use a USB scanner (it types the code and presses Enter).
 */
export function BarcodeScanner({ opened, onClose, onCode }: { opened: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [typed, setTyped] = useState('');
  const [camera, setCamera] = useState<'starting' | 'on' | 'none'>('starting');
  const BD = (window as unknown as { BarcodeDetector?: new (o?: { formats?: string[] }) => Detector }).BarcodeDetector;

  useEffect(() => {
    if (!opened) return;
    setTyped('');
    if (!BD || !navigator.mediaDevices?.getUserMedia) {
      setCamera('none');
      return;
    }
    let stream: MediaStream | null = null;
    let stop = false;
    const detector = new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        setCamera('on');
        const tick = async () => {
          if (stop || !video.current) return;
          try {
            const found = await detector.detect(video.current);
            if (found[0]?.rawValue) {
              onCode(found[0].rawValue);
              return;
            }
          } catch {
            /* keep trying */
          }
          setTimeout(tick, 250);
        };
        tick();
      } catch {
        setCamera('none');
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} title="Scan barcode">
      <Stack>
        {camera !== 'none' ? (
          <Box style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#111111', aspectRatio: '4 / 3' }}>
            <video ref={video} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box style={{ position: 'absolute', left: '10%', right: '10%', top: '45%', height: 2, background: '#FA5252', boxShadow: '0 0 8px #FA5252' }} />
          </Box>
        ) : (
          <Group gap="xs" wrap="nowrap">
            <ScanLine size={18} color="#868E96" />
            <Text size="xs" c="dimmed">This phone can't scan with the camera here. Type the number, or use a USB scanner.</Text>
          </Group>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) onCode(typed.trim());
          }}
        >
          <Group gap="xs" wrap="nowrap" align="flex-end">
            <TextInput
              label="Or type the number"
              placeholder="e.g. 6161101600019"
              inputMode="numeric"
              autoFocus={camera === 'none'}
              value={typed}
              onChange={(e) => setTyped(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" disabled={!typed.trim()}>Find</Button>
          </Group>
        </form>
      </Stack>
    </Modal>
  );
}
