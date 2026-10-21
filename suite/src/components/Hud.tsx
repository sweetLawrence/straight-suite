import type { ReactNode } from 'react'

/** Soft, slow-moving colour behind the page. Decorative only. */
export function Backdrop() {
  return (
    <div className="bd" aria-hidden="true">
      <div className="dotgrid" />
    </div>
  )
}

export function Frame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
