import { useEffect, useState } from 'react'
import { IS_APP_START_PAGE } from './lib/config'
import { lastTab, rememberTab, signedInName, signOut, type AppKey } from './lib/session'
import StartPage from './components/StartPage'
import SignIn from './components/SignIn'
import Home from './components/Home'
import Shell from './components/Shell'

// If the Suite ends up inside one of its own tabs, that app's files are missing from gateway
const INSIDE_A_TAB = window.self !== window.top

const hashTab = (): AppKey | null => {
  const h = location.hash.replace('#', '')
  return h === 'inv' || h === 'bkg' ? h : null
}

export default function App() {
  const [user, setUser] = useState<{ name: string; note: string } | null>(() => {
    const n = signedInName()
    return n ? { name: n, note: '' } : null
  })
  const [tab, setTab] = useState<AppKey>(() => hashTab() ?? lastTab())
  const [opened, setOpened] = useState<AppKey[]>(() => (hashTab() ? [hashTab()!] : []))
  const [view, setView] = useState<'home' | 'apps'>(() => (hashTab() ? 'apps' : 'home'))

  const pick = (k: AppKey) => {
    setTab(k)
    setOpened((o) => (o.includes(k) ? o : [...o, k]))
    setView('apps')
    rememberTab(k)
    history.replaceState(null, '', `#${k}`)
  }
  const goHome = () => {
    setView('home')
    history.replaceState(null, '', location.pathname)
  }
  const leave = () => {
    signOut()
    setUser(null)
    setOpened([])
    setView('home')
    history.replaceState(null, '', location.pathname)
  }

  // Alt+1 Bookings, Alt+2 Inventory, from anywhere once signed in
  useEffect(() => {
    if (!user) return
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || (e.key !== '1' && e.key !== '2')) return
      e.preventDefault()
      pick(e.key === '1' ? 'bkg' : 'inv')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [user])

  if (INSIDE_A_TAB) {
    return (
      <div className="startwrap">
        <div className="startcard">
          <h1>App not found</h1>
          <p className="lead">
            This app is not in the gateway folder yet. Copy the contents of its dist folder into gateway/inventory or gateway/bookings
            (index.html must sit directly inside), then reload.
          </p>
        </div>
      </div>
    )
  }
  if (IS_APP_START_PAGE) return <StartPage />
  if (!user) {
    return <SignIn onDone={(name, problems) => {
      setUser({ name, note: problems.length ? `${problems.join(' · ')}. Sign in inside that app.` : '' })
      setView('home')
    }} />
  }
  return (
    <>
      {view === 'home' && <Home name={user.name} note={user.note} onOpen={pick} onSignOut={leave} />}
      <Shell tab={tab} opened={opened} visible={view === 'apps'} name={user.name} note={user.note} onPick={pick} onHome={goHome} onSignOut={leave} />
    </>
  )
}
