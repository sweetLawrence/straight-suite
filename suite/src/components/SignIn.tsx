import { useState, type FormEvent } from 'react'
import { signIn } from '../lib/session'
import { Backdrop } from './Hud'
import { Logo } from './Icons'

export default function SignIn({ onDone }: { onDone: (name: string, problems: string[]) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await signIn(email.trim(), password)
      onDone(r.name, r.problems)
    } catch (err) {
      setError(err instanceof TypeError ? 'Could not reach the servers. Check the internet connection and try again.' : (err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="page authpage">
      <Backdrop />
      <div className="authbrand rise"><Logo size={44} /><div><b>Straight Suite</b><span>Straight Group</span></div></div>

      <form className={`authcard rise${error ? ' shake' : ''}`} style={{ animationDelay: '.1s' }} onSubmit={submit}>
        <h2>Welcome back</h2>
        <p className="sub">Sign in once to use Bookings and Inventory.</p>

        {error && (
          <div className="alert" role="alert">
            <b>Could not sign in</b>
            {error.split(' | ').map((l) => <span key={l}>{l}</span>)}
          </div>
        )}

        <label htmlFor="em">Email</label>
        <input id="em" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="pw">Password</label>
        <div className="pwrow">
          <input id="pw" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="reveal" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
        </div>

        <button className="primary" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <p className="help">Trouble signing in? Ask your administrator.</p>
        {busy && <i className="progress" />}
      </form>
      <p className="foot">Mums&rsquo; Garden Resort &nbsp;&middot;&nbsp; Centurion Hotel</p>
    </div>
  )
}
