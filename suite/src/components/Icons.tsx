const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const CalendarIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
)
export const BoxIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>
)
export const HomeIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>
)

/** The company mark sits on a white tile so it reads on any background */
export const Logo = ({ size = 40 }: { size?: number }) => (
  <span className="logo" style={{ width: size, height: size }}>
    <img src="/icons/icon-192.png" alt="" width={size - 8} height={size - 8} />
  </span>
)
