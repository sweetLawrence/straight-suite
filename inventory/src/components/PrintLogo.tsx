import { useState } from 'react';
import { BASE } from '@/lib/utils/basePath';

/**
 * The property logo for the top of printed reports (A4 / PDF).
 * Uses the property's logo_url when set, else /logos/<code>.png then .svg from the public folder
 * (MG.png, CEN.png, GROUP.png for both properties; lower case names also work).
 * Hidden if no file is found.
 */
export function PrintLogo({ code, logoUrl, height = 54, center = false }: { code?: string | null; logoUrl?: string | null; height?: number; center?: boolean }) {
  const name = code || 'GROUP';
  const sources = [
    ...(logoUrl ? [logoUrl] : []),
    ...[name.toUpperCase(), name.toLowerCase()].flatMap((n) => [`${BASE}/logos/${n}.png`, `${BASE}/logos/${n}.svg`, `${BASE}/logos/${n}.jpg`]),
  ];
  // Remember which files failed, by address, so a late-arriving property code starts fresh
  const [bad, setBad] = useState<string[]>([]);
  const src = sources.find((s) => !bad.includes(s));
  if (!src) return null;
  return (
    <img
      key={src}
      src={src}
      alt=""
      onError={() => setBad((b) => [...b, src])}
      style={{ height, maxWidth: 200, objectFit: 'contain', display: center ? 'block' : 'inline-block', margin: center ? '0 auto 6px' : undefined }}
    />
  );
}
