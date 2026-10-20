import { useState, type FormEvent } from 'react'
import { signIn } from '../lib/session'

export default function SignIn({ onDone }: { onDone: (name: string, problems: string[]) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('Signing in...')
    try {
      const r = await signIn(email.trim(), password)
      onDone(r.name, r.problems)
    } catch (err) {
      setMsg(err instanceof TypeError ? 'Could not reach the servers. Check the internet and the addresses in config.js.' : (err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="center">
      <form className="box" onSubmit={submit}>
        <h1>Straight Suite</h1>
        <p className="sub">Sign in once for Inventory and Bookings</p>
        <label htmlFor="em">Email</label>
        <input id="em" type="text" autoComplete="username" autoCapitalize="none" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="main" type="submit" disabled={busy}>Sign in</button>
        <div className="msg" role="status">{msg}</div>
        <div className="note">Use the same email and password in both systems.</div>
      </form>
    </div>
  )
}
