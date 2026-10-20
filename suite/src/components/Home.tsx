import { appStatus, type AppKey } from '../lib/session'
import { BoxIcon, CalendarIcon, Logo } from './Icons'

const TILES: { key: AppKey; title: string; text: string; Icon: typeof BoxIcon; tint: string; ink: string }[] = [
  { key: 'bkg', title: 'Bookings', text: 'Rooms, guests, payments and the front desk.', Icon: CalendarIcon, tint: '#FDF0D0', ink: '#8A5A00' },
  { key: 'inv', title: 'Inventory', text: 'Orders, bar, kitchen, stock, cash and reports.', Icon: BoxIcon, tint: '#E2EAF8', ink: '#0B2E73' },
]

function greeting(first: string) {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${part}, ${first}`
}

export default function Home({ name, note, onOpen, onSignOut }: { name: string; note: string; onOpen: (k: AppKey) => void; onSignOut: () => void }) {
  const status = appStatus()
  const first = name.split(/\s+/)[0] || name
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="home">
      <header className="homebar">
        <div className="brand dark"><Logo size={34} /><span>Straight Suite</span></div>
        <div className="homeuser">
          <span>{name}</span>
          <button type="button" className="textbtn" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <main className="homemain">
        <h1>{greeting(first)}</h1>
        <p className="date">{today}</p>
        {note && <p className="homenote" role="status">{note}</p>}

        <div className="tiles">
          {TILES.map(({ key, title, text, Icon, tint, ink }) => (
            <button key={key} type="button" className="tile" onClick={() => onOpen(key)}>
              <span className="ticon" style={{ background: tint, color: ink }}><Icon size={26} /></span>
              <span className="ttitle">{title}</span>
              <span className="ttext">{text}</span>
              <span className="tfoot">
                <span className="tstatus"><i style={{ background: status[key] ? '#1F9D55' : '#F9AB12' }} />{status[key] ? 'Signed in' : 'Sign in needed'}</span>
                <span className="topen">Open {title}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="hint">Inside the Suite, Alt+1 opens Bookings and Alt+2 opens Inventory.</p>
      </main>
    </div>
  )
}
