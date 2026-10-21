import { useEffect, useState } from 'react'
import { SUITE_URL } from '../lib/config'
import { Backdrop } from './Hud'
import { Logo } from './Icons'

type Upd = 'checking' | 'none' | 'skipped' | { version: string }

/** Windows app only: welcome screen and update check, then opens the website (sign-in and the two apps live there). */
export default function StartPage() {
  const [upd, setUpd] = useState<Upd>('checking')
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const core = window.__TAURI__?.core

  useEffect(() => {
    if (!core) { setUpd('skipped'); return }
    core.invoke('check_update').then((v) => setUpd(v ? { version: String(v) } : 'none')).catch(() => setUpd('skipped'))
  }, [core])

  const update = () => {
    setUpdating(true)
    core?.invoke('install_update').catch(() => { setMsg('Update failed. Try again later.'); setUpdating(false) })
  }

  const open = async () => {
    setBusy(true)
    setMsg('')
    const ctl = new AbortController()
    const t = setTimeout(() => ctl.abort(), 70000) // a sleeping server can take a minute
    try {
      await fetch(`${SUITE_URL}/`, { mode: 'no-cors', cache: 'no-store', signal: ctl.signal })
      location.href = `${SUITE_URL}/`
    } catch {
      setMsg('No connection. Check the internet and try again.')
      setBusy(false)
    } finally {
      clearTimeout(t)
    }
  }

  const checking = upd === 'checking'
  const status =
    checking ? 'Checking for updates' :
    upd === 'none' ? 'You are up to date' :
    upd === 'skipped' ? 'Ready' :
    `Version ${upd.version} is available`

  return (
    <div className="page intro">
      <Backdrop />
      <div className="intro-in">
        <div className="intro-mark rise"><Logo size={76} /></div>
        <p className="kicker rise" style={{ animationDelay: '.1s' }}>Straight Group</p>
        <h1 className="rise" style={{ animationDelay: '.18s' }}>Straight Suite</h1>
        <p className="tag rise" style={{ animationDelay: '.26s' }}>Bookings and Inventory for Mums&rsquo; Garden Resort and Centurion Hotel.</p>

        <div className="statusline rise" style={{ animationDelay: '.4s' }} role="status">
          {checking ? <i className="spinner" /> : <i className={`sdot${typeof upd === 'object' ? ' gold' : ''}`} />}
          <span>{status}</span>
          {typeof upd === 'object' && (
            <button type="button" className="textbtn" onClick={update} disabled={updating}>{updating ? 'Updating...' : 'Update now'}</button>
          )}
        </div>

        <button className="primary wide rise" style={{ animationDelay: '.5s' }} type="button" onClick={open} disabled={busy}>
          {busy ? 'Opening...' : 'Open Straight Suite'}
        </button>
        <div className="msg" role="alert">{msg}</div>
      </div>
      <p className="foot">&copy; Straight Group</p>
    </div>
  )
}
