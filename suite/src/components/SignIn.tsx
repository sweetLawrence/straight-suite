import { useState, type FormEvent } from 'react'
import { signIn } from '../lib/session'
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
    <div className="auth">
      <aside className="panel">
        <div className="brand"><Logo size={40} /><span>Straight Group</span></div>
        <div className="sky">
          <div className="sun" />
          <h1>One sign-in.<br />Both systems.</h1>
        </div>
        <div className="horizon" />
        <p className="below">Bookings for rooms and guests, Inventory for orders, stock and cash. Run for Mums&rsquo; Garden Resort and Centurion Hotel.</p>
      </aside>

      <main className="formside">
        <div className="mobilebrand"><Logo size={36} /><span>Straight Group</span></div>
        <form className="signform" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="lead">Use your work email and password.</p>

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
        </form>
      </main>
    </div>
  )
}
