import { useState } from 'react'
import { IS_APP_START_PAGE } from './lib/config'
import { signedInName, signOut } from './lib/session'
import StartPage from './components/StartPage'
import SignIn from './components/SignIn'
import Shell from './components/Shell'

// If the Suite ends up inside one of its own tabs, that app's files are missing from gateway
const INSIDE_A_TAB = window.self !== window.top

export default function App() {
  const [user, setUser] = useState<{ name: string; note: string } | null>(() => {
    const n = signedInName()
    return n ? { name: n, note: '' } : null
  })

  if (INSIDE_A_TAB) {
    return (
      <div className="center">
        <div className="box">
          <h1>App not found</h1>
          <p className="sub">
            This app is not in the gateway folder yet. Copy the contents of its dist folder into gateway/inventory or gateway/bookings
            (index.html must sit directly inside), then reload.
          </p>
        </div>
      </div>
    )
  }
  if (IS_APP_START_PAGE) return <StartPage />
  if (!user) return <SignIn onDone={(name, problems) => setUser({ name, note: problems.length ? `${problems.join(' · ')} (sign in inside that app)` : '' })} />
  return <Shell name={user.name} note={user.note} onSignOut={() => { signOut(); setUser(null) }} />
}
