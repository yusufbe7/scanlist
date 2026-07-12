import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function RegisterScreen({ onDone }: { onDone: () => void }) {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return setError("Ismingizni kiriting")
    if (!email.includes('@')) return setError("Email kiriting")
    if (password.length < 6) return setError("Parol kamida 6 belgi bo'lishi kerak")

    setSubmitting(true)
    setError(null)
    const err = await signUp(email, password, fullName.trim(), phone.trim())
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    onDone()
  }

  return (
    <div className="max-w-[420px] mx-auto min-h-screen flex flex-col bg-white dark:bg-ink">
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <button onClick={onDone} className="w-9 h-9 rounded-full bg-surface dark:bg-black/20 flex items-center justify-center">
          <ArrowLeft size={16} className="text-ink dark:text-ink-dark" />
        </button>
        <h1 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Ro'yxatdan o'tish</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-3">
        <Field label="F.I.Sh." value={fullName} onChange={setFullName} placeholder="Ismingiz" />
        <Field label="Telefon raqam" value={phone} onChange={setPhone} placeholder="+998 90 123 45 67" type="tel" />
        <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
        <Field label="Parol" value={password} onChange={setPassword} placeholder="Kamida 6 belgi" type="password" />

        {error && <p className="text-xs text-danger px-1">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white rounded-xl py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition mt-2"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Ro'yxatdan o'tish
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3 text-sm text-ink dark:text-ink-dark placeholder:text-muted outline-none"
      />
    </label>
  )
}
