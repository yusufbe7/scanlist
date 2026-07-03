import { useState, useMemo } from 'react'
import { X, Shield, Crown, Search, UserCheck, UserX, Users } from 'lucide-react'
import { getAllUsers, grantPro, revokePro, validateAdminPassword } from '../lib/userManager'
import type { AdminUser } from '../types'

interface Props { open: boolean; onClose: () => void }

export function AdminPanel({ open, onClose }: Props) {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [proInput, setProInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  if (!open) return null

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (validateAdminPassword(password)) { setAuthenticated(true); setPasswordError(false) }
    else setPasswordError(true)
  }

  function handleGrantPro() {
    const id = proInput.trim()
    if (!id) return
    const success = grantPro(id, 1)
    setActionMessage(success ? `✅ Pro 1 oyga berildi: ${id}` : `❌ Foydalanuvchi topilmadi: ${id}`)
    if (success) { setProInput(''); setRefreshKey(k => k + 1) }
    setTimeout(() => setActionMessage(null), 3000)
  }

  function handleRevokePro(userId: string) {
    revokePro(userId)
    setActionMessage(`🚫 Pro olib tashlandi: ${userId}`)
    setRefreshKey(k => k + 1)
    setTimeout(() => setActionMessage(null), 3000)
  }

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[65] flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] glass rounded-3xl p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"><X size={14} /></button>
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4"><Shield size={22} className="text-red-500" /></div>
          <h2 className="font-display font-bold text-lg text-ink dark:text-ink-dark text-center mb-1">Admin Panel</h2>
          <p className="text-xs text-muted text-center mb-6">Kirish uchun parolni kiriting</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setPasswordError(false) }} placeholder="Parol"
              className={`w-full bg-white/60 dark:bg-white/5 border rounded-xl px-4 py-3 text-sm font-medium text-ink dark:text-ink-dark placeholder-muted/60 outline-none transition-all ${passwordError ? 'border-red-400 ring-2 ring-red-400/20' : 'border-border dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
              autoFocus />
            {passwordError && <p className="text-xs text-red-500 text-center">Noto'g'ri parol</p>}
            <button type="submit" className="w-full bg-ink dark:bg-white text-white dark:text-ink rounded-xl py-3 font-display font-bold text-sm active:scale-[0.97] transition-all">Kirish</button>
          </form>
        </div>
      </div>
    )
  }

  return <Dashboard onClose={() => { setAuthenticated(false); setPassword(''); onClose() }}
    proInput={proInput} setProInput={setProInput} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
    actionMessage={actionMessage} onGrantPro={handleGrantPro} onRevokePro={handleRevokePro} refreshKey={refreshKey} />
}

function Dashboard({ onClose, proInput, setProInput, searchQuery, setSearchQuery, actionMessage, onGrantPro, onRevokePro, refreshKey }: {
  onClose: () => void; proInput: string; setProInput: (v: string) => void; searchQuery: string; setSearchQuery: (v: string) => void
  actionMessage: string | null; onGrantPro: () => void; onRevokePro: (id: string) => void; refreshKey: number
}) {
  const users = useMemo(() => getAllUsers(), [refreshKey]) // eslint-disable-line
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase()
    return users.filter(u => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
  }, [users, searchQuery])
  const totalUsers = users.length
  const proUsers = users.filter(u => u.isPro).length
  const totalScans = users.reduce((s, u) => s + u.totalScans, 0)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[65] flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-ink w-full max-w-[500px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border-dark">
          <div className="flex items-center gap-2"><Shield size={16} className="text-red-500" /><h2 className="font-display font-bold text-base text-ink dark:text-ink-dark">Admin Panel</h2></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface dark:bg-white/10 flex items-center justify-center"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 text-center"><Users size={16} className="mx-auto text-primary mb-1" /><div className="font-display font-bold text-lg text-ink dark:text-ink-dark">{totalUsers}</div><div className="text-[10px] text-muted">Foydalanuvchilar</div></div>
            <div className="glass rounded-xl p-3 text-center"><Crown size={16} className="mx-auto text-yellow-500 mb-1" /><div className="font-display font-bold text-lg text-ink dark:text-ink-dark">{proUsers}</div><div className="text-[10px] text-muted">Pro</div></div>
            <div className="glass rounded-xl p-3 text-center"><div className="text-primary text-sm mb-1">📊</div><div className="font-display font-bold text-lg text-ink dark:text-ink-dark">{totalScans}</div><div className="text-[10px] text-muted">Jami scan</div></div>
          </div>
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2">Pro berish</h4>
            <div className="flex gap-2">
              <input value={proInput} onChange={e => setProInput(e.target.value)} placeholder="Foydalanuvchi ID"
                className="flex-1 bg-surface dark:bg-white/5 border border-border dark:border-border-dark rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-colors" />
              <button onClick={onGrantPro} className="bg-primary text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"><Crown size={13} />1 oy</button>
            </div>
            {actionMessage && <p className="text-xs mt-2 text-center font-medium">{actionMessage}</p>}
          </section>
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2">Foydalanuvchilar ({filteredUsers.length})</h4>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ism yoki ID"
                className="w-full bg-surface dark:bg-white/5 border border-border dark:border-border-dark rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredUsers.length === 0 ? <p className="text-sm text-muted text-center py-4">Topilmadi</p> :
                filteredUsers.map(user => <UserRow key={user.id} user={user} onRevokePro={onRevokePro} />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, onRevokePro }: { user: AdminUser; onRevokePro: (id: string) => void }) {
  const isActive = user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date()
  return (
    <div className="flex items-center justify-between bg-surface dark:bg-white/5 border border-border dark:border-border-dark rounded-xl px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-ink dark:text-ink-dark truncate">{user.name}</span>
          {isActive && <Crown size={12} className="text-yellow-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[10px] text-muted truncate">{user.id}</span>
          <span className="text-[10px] text-muted">· {user.totalScans} scan</span>
        </div>
      </div>
      {isActive ? (
        <button onClick={() => onRevokePro(user.id)} className="ml-2 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0" title="Pro olib tashlash">
          <UserX size={13} className="text-red-500" />
        </button>
      ) : (
        <div className="ml-2 w-7 h-7 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <UserCheck size={13} className="text-green-500 opacity-40" />
        </div>
      )}
    </div>
  )
}
