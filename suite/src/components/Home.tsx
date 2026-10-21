import { appStatus, type AppKey } from '../lib/session'
import { Backdrop } from './Hud'
import { BoxIcon, CalendarIcon, Logo } from './Icons'

const TILES: { key: AppKey; title: string; text: string; Icon: typeof BoxIcon; tint: string; ink: string }[] = [
  { key: 'bkg', title: 'Bookings', text: 'Rooms, guests, payments and the front desk.', Icon: CalendarIcon, tint: '#E2EAF8', ink: '#0B2E73' },
  { key: 'inv', title: 'Inventory', text: 'Orders, bar, kitchen, stock, cash and reports.', Icon: BoxIcon, tint: '#E2EAF8', ink: '#0B2E73' },
]

function greeting(first: string) {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${part}, ${first}`
}

export default function Home({ name, note, onOpen, onSignOut }: { name: string; note: string; onOpen: (k: AppKey) => void; onSignOut: () => void }) {
  const status = appStatus()
  const online = Number(status.bkg) + Number(status.inv)
  const first = name.split(/\s+/)[0] || name
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="page home">
      <Backdrop />
      <header className="hbar">
        <div className="brandrow"><Logo size={34} /><span>Straight Suite</span></div>
        <div className="hright">
          <span className="who2">{name}</span>
          <button type="button" className="textbtn" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <main className="hmain">
        <h1 className="rise">{greeting(first)}</h1>
        <p className="date rise" style={{ animationDelay: '.06s' }}>
          {today}
          <span className="count" title="Systems signed in"><b>{online}</b> of 2 signed in</span>
        </p>
        {note && <p className="homenote" role="status">{note}</p>}

        <div className="mods">
          {TILES.map(({ key, title, text, Icon, tint, ink }, i) => {
            const ok = status[key]
            return (
              <button key={key} type="button" className="mod rise" style={{ animationDelay: `${0.14 + i * 0.1}s` }} onClick={() => onOpen(key)}>
                <span className="micon" style={{ background: tint, color: ink }}><Icon size={26} /></span>
                <span className="mtitle">{title}</span>
                <span className="mtext">{text}</span>
                <span className="mfoot">
                  <span className="mstat"><i className={ok ? 'ok' : 'wait'} />{ok ? 'Signed in' : 'Sign-in needed'}</span>
                  <span className="mopen">Open {title}</span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="hint">Inside the Suite, Alt+1 opens Bookings and Alt+2 opens Inventory.</p>
      </main>
    </div>
  )
}
