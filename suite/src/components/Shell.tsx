import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { lastTab, rememberTab, type AppKey } from '../lib/session'

const APPS: { key: AppKey; label: string; dot: string; src: string; shortcut: string }[] = [
  { key: 'bkg', label: 'Bookings', dot: '#2DD4BF', src: '/bookings/', shortcut: '1' },
  { key: 'inv', label: 'Inventory', dot: '#7FB0F0', src: '/inventory/', shortcut: '2' },
]


const POS = 'suite_dock_pos'

const Calendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
)
const Box = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>
)
const ICON: Record<AppKey, () => JSX.Element> = { bkg: Calendar, inv: Box }


function startTab(): AppKey {
  const h = location.hash.replace('#', '')
  return h === 'inv' || h === 'bkg' ? h : lastTab()
}

function startPos(): { x: number; y: number } {
  try {
    const p = JSON.parse(localStorage.getItem(POS) || '')
    if (typeof p.x === 'number' && typeof p.y === 'number') return p
  } catch { /* none saved */ }
  return { x: Math.round(window.innerWidth / 2) - 70, y: window.innerHeight - 34 } // bottom centre
}

/** Both apps fill the whole window and stay mounted once opened. A small movable pill switches between them. */
export default function Shell({ name, note, onSignOut }: { name: string; note: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<AppKey>(startTab)
  const [opened, setOpened] = useState<AppKey[]>([tab])
  const [pos, setPos] = useState(startPos)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  const pick = (k: AppKey) => {
    setTab(k)
    setOpened((o) => (o.includes(k) ? o : [...o, k]))
    rememberTab(k)
    history.replaceState(null, '', `#${k}`)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = APPS.find((x) => x.shortcut === e.key)
      if (e.altKey && a) { e.preventDefault(); pick(a.key) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Keep the pill on screen if the window is made smaller
  useEffect(() => {
    const fit = () => setPos((p) => ({ x: Math.min(p.x, window.innerWidth - 60), y: Math.min(p.y, window.innerHeight - 30) }))
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const down = (e: RPointerEvent) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const move = (e: RPointerEvent) => {
    if (!drag.current) return
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - drag.current.dx)),
      y: Math.max(0, Math.min(window.innerHeight - 30, e.clientY - drag.current.dy)),
    })
  }
  const up = () => {
    if (!drag.current) return
    drag.current = null
    try { localStorage.setItem(POS, JSON.stringify(pos)) } catch { /* private mode */ }
  }

  return (
    <div className="shell">
      <div className="frames">
        {APPS.filter((a) => opened.includes(a.key)).map((a) => (
          <iframe key={a.key} title={a.label} src={a.src} allow="clipboard-write; fullscreen" className={tab === a.key ? 'on' : ''} />
        ))}
      </div>
      <div
        className="dock"
        style={pos.x > window.innerWidth / 2 ? { right: Math.max(0, window.innerWidth - pos.x - 86), top: pos.y } : { left: pos.x, top: pos.y }}
      >
        <span className="grip" title="Drag to move" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        {APPS.map((a) => {
          const Icon = ICON[a.key]
          return (
            <button key={a.key} type="button" className={`dtab${tab === a.key ? ' on' : ''}`} onClick={() => pick(a.key)} title={`${a.label} (Alt+${a.shortcut})`}>
              <Icon />
              <span className="lbl">{a.label}</span>
            </button>
          )
        })}
        <span className="more">
          <span className="who" title={note || name}>{name}{note ? ' ⚠' : ''}</span>
          <button type="button" className="out" onClick={onSignOut}>Sign out</button>
        </span>
      </div>
    </div>
  )
}
