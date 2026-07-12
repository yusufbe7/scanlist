import { useState } from 'react'
import { CloudOff } from 'lucide-react'
import { useAuth, isSyncConfigured } from '../../context/AuthContext'
import { LoginScreen } from './LoginScreen'
import { RegisterScreen } from './RegisterScreen'

function ConfigMissingScreen() {
  return (
    <div className="max-w-[420px] mx-auto min-h-screen flex flex-col items-center justify-center px-8 text-center bg-white dark:bg-ink">
      <CloudOff size={48} className="text-danger mb-4" />
      <h1 className="font-display font-bold text-lg text-ink dark:text-ink-dark mb-2">Supabase sozlanmagan</h1>
      <p className="text-sm text-muted">
        Ilovani ishga tushirishdan oldin <span className="font-mono">.env</span> fayliga{' '}
        <span className="font-mono">VITE_SUPABASE_URL</span> va <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> qiymatlarini
        qo'shing. Batafsil: README.md.
      </p>
    </div>
  )
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [registering, setRegistering] = useState(false)

  if (!isSyncConfigured) return <ConfigMissingScreen />

  if (!user) {
    return registering ? <RegisterScreen onDone={() => setRegistering(false)} /> : <LoginScreen onRegister={() => setRegistering(true)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ink">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
