import { useState } from 'react'
import { UserPlus, Package } from 'lucide-react'

interface Props {
  onRegister: (name: string) => void
}

export function RegisterScreen({ onRegister }: Props) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return
    onRegister(name.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-ink dark:via-ink dark:to-primary-dark/20 p-4">
      <div className="w-full max-w-[380px] glass rounded-3xl p-8 text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-scan">
          <Package size={28} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-ink dark:text-ink-dark mb-1">ScanList</h1>
        <p className="text-sm text-muted dark:text-muted-dark mb-8">Supermarket uchun tez barcode skaner</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ismingizni kiriting"
            className="w-full bg-white/60 dark:bg-white/5 border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-sm font-medium text-ink dark:text-ink-dark placeholder-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            autoFocus
            maxLength={30}
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all shadow-scan"
          >
            <UserPlus size={16} />
            Ro'yxatdan o'tish
          </button>
        </form>
        <p className="text-[11px] text-muted dark:text-muted-dark mt-6">Bepul · 100 ta scan · Pro — cheksiz</p>
      </div>
    </div>
  )
}
