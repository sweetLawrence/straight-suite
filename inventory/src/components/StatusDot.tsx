import { Box } from '@mantine/core';

/** Small coloured dot shown next to a card's label. Replaces coloured card borders. */
export function StatusDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <Box
      component="span"
      aria-hidden
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
  );
}
