import { useState } from 'react'
import { Package, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function LoginScreen({ onRegister }: { onRegister: () => void }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@') || password.length < 6) {
      setError('Email va parolni (kamida 6 belgi) to\'g\'ri kiriting')
      return
    }
    setSubmitting(true)
    setError(null)
    const err = await signIn(email, password)
    setSubmitting(false)
    if (err) setError(err.toLowerCase().includes('invalid login credentials') ? "Email yoki parol noto'g'ri" : err)
  }

  return (
    <div className="max-w-[420px] mx-auto min-h-screen flex flex-col justify-center px-6 py-10 bg-white dark:bg-ink">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-scan mb-4">
          <Package size={36} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-ink dark:text-ink-dark">ScanList</h1>
        <p className="text-sm text-muted mt-1">Barcode skaner va ro'yxat ilovasi</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="sr-only">Email</span>
          <div className="flex items-center gap-2.5 bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3">
            <Mail size={16} className="text-muted shrink-0" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 bg-transparent outline-none text-sm text-ink dark:text-ink-dark placeholder:text-muted"
              autoComplete="email"
            />
          </div>
        </label>
        <label className="block">
          <span className="sr-only">Parol</span>
          <div className="flex items-center gap-2.5 bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3">
            <Lock size={16} className="text-muted shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Parol"
              className="flex-1 bg-transparent outline-none text-sm text-ink dark:text-ink-dark placeholder:text-muted"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="text-muted shrink-0">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {error && <p className="text-xs text-danger px-1">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white rounded-xl py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Kirish
        </button>
        <button type="button" onClick={onRegister} className="w-full text-primary text-sm font-semibold py-2">
          Hisobingiz yo'qmi? Ro'yxatdan o'tish
        </button>
      </form>
    </div>
  )
}
