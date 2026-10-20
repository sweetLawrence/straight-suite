import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { AppKey } from '../lib/session'
import { BoxIcon, CalendarIcon, HomeIcon } from './Icons'

const APPS: { key: AppKey; label: string; src: string; shortcut: string; Icon: typeof BoxIcon }[] = [
  { key: 'bkg', label: 'Bookings', src: '/bookings/', shortcut: '1', Icon: CalendarIcon },
  { key: 'inv', label: 'Inventory', src: '/inventory/', shortcut: '2', Icon: BoxIcon },
]

const POS = 'suite_dock_pos'

function startPos(): { x: number; y: number } {
  try {
    const p = JSON.parse(localStorage.getItem(POS) || '')
    if (typeof p.x === 'number' && typeof p.y === 'number') return p
  } catch { /* none saved */ }
  return { x: Math.round(window.innerWidth / 2) - 80, y: window.innerHeight - 34 } // bottom centre
}

interface Props {
  tab: AppKey
  opened: AppKey[]
  visible: boolean
  name: string
  note: string
  onPick: (k: AppKey) => void
  onHome: () => void
  onSignOut: () => void
}

/** Both apps fill the whole window and stay mounted once opened. A small movable pill switches between them. */
export default function Shell({ tab, opened, visible, name, note, onPick, onHome, onSignOut }: Props) {
  const [pos, setPos] = useState(startPos)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

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
    <div className="shell" style={{ display: visible ? 'block' : 'none' }}>
      <div className="frames">
        {APPS.filter((a) => opened.includes(a.key)).map((a) => (
          <iframe key={a.key} title={a.label} src={a.src} allow="clipboard-write; fullscreen" className={tab === a.key ? 'on' : ''} />
        ))}
      </div>
      <div className="dock" style={pos.x > window.innerWidth / 2 ? { right: Math.max(0, window.innerWidth - pos.x - 116), top: pos.y } : { left: pos.x, top: pos.y }}>
        <span className="grip" title="Drag to move" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        <button type="button" className="dtab" onClick={onHome} title="Home">
          <HomeIcon />
          <span className="lbl">Home</span>
        </button>
        {APPS.map(({ key, label, shortcut, Icon }) => (
          <button key={key} type="button" className={`dtab${tab === key ? ' on' : ''}`} onClick={() => onPick(key)} title={`${label} (Alt+${shortcut})`}>
            <Icon />
            <span className="lbl">{label}</span>
          </button>
        ))}
        <span className="more">
          <span className="who" title={note || name}>{name}{note ? ' ⚠' : ''}</span>
          <button type="button" className="out" onClick={onSignOut}>Sign out</button>
        </span>
      </div>
    </div>
  )
}
