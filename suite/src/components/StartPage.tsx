import { useEffect, useState } from 'react'
import { SUITE_URL } from '../lib/config'
import { Logo } from './Icons'

/** Windows app only: update check, then open the website (sign-in and the two apps live there). */
export default function StartPage() {
  const [version, setVersion] = useState('')
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const core = window.__TAURI__?.core

  useEffect(() => {
    core?.invoke('check_update').then((v) => { if (v) setVersion(String(v)) }).catch(() => {})
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

  return (
    <div className="startwrap">
      <div className="startcard">
        <Logo size={56} />
        <h1>Straight Suite</h1>
        <p className="lead">Bookings and Inventory in one place.</p>
        {version && (
          <div className="upd">
            <span>Version {version} is ready.</span>
            <button type="button" onClick={update} disabled={updating}>{updating ? 'Updating...' : 'Update now'}</button>
          </div>
        )}
        <button className="primary" type="button" onClick={open} disabled={busy}>{busy ? 'Opening...' : 'Open Straight Suite'}</button>
        <div className="msg" role="status">{msg}</div>
      </div>
    </div>
  )
}
