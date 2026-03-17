import { useEffect, useState } from 'react'
import { LoginPage } from './components/LoginPage'
import { ScratchPage } from './components/ScratchPage'

type AuthState = 'loading' | 'authed' | 'unauthed'

export default function App() {
  const [auth, setAuth] = useState<AuthState>('loading')

  useEffect(() => {
    fetch('/api/auth/check', { credentials: 'include' })
      .then(r => setAuth(r.ok ? 'authed' : 'unauthed'))
      .catch(() => setAuth('unauthed'))
  }, [])

  useEffect(() => {
    const handler = () => setAuth('unauthed')
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  if (auth === 'loading') return null
  if (auth === 'unauthed') return <LoginPage onLogin={() => setAuth('authed')} />
  return <ScratchPage />
}
