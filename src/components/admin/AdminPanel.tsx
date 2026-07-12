import { useEffect, useState } from 'react'
import { X, Check, Ban, Loader2, Search, Receipt } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { allPayments, approvePayment, rejectPayment, receiptSignedUrl } from '../../lib/paymentService'
import { listProfiles, setRole, addCredits } from '../../lib/adminService'
import { fetchSettings, updateSettings } from '../../lib/settingsService'
import type { AppProfile, AppSettings, PaymentRecord, PaymentStatus } from '../../types'
import { StatusBadge } from '../StatusBadge'

type Tab = 'pending' | 'all' | 'users' | 'settings'

const fmt = (n: number) => n.toLocaleString('uz-UZ')

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('pending')

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-white dark:bg-ink z-[70] flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border dark:border-border-dark">
        <h2 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Admin panel</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface dark:bg-black/20 flex items-center justify-center">
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-3 overflow-x-auto shrink-0">
        {(
          [
            ['pending', 'Kutilayotgan'],
            ['all', "Barcha to'lovlar"],
            ['users', 'Foydalanuvchilar'],
            ['settings', 'Sozlamalar']
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap ${
              tab === key ? 'bg-primary text-white' : 'bg-surface dark:bg-black/20 text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'pending' && <PaymentsTab statusFilter="pending" />}
        {tab === 'all' && <PaymentsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function PaymentsTab({ statusFilter }: { statusFilter?: PaymentStatus }) {
  const { show } = useToast()
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function load() {
    setPayments(null)
    allPayments(statusFilter).then(setPayments)
  }

  useEffect(load, [statusFilter])

  async function handleApprove(p: PaymentRecord) {
    if (!confirm(`${fmt(p.credits)} kredit foydalanuvchi hisobiga qo'shiladi. Davom etasizmi?`)) return
    const err = await approvePayment(p.id)
    if (err) show(`❌ ${err}`)
    else {
      show('✅ Tasdiqlandi')
      load()
    }
  }

  async function handleReject(id: string) {
    const reason = rejectReason.trim() || "Sabab ko'rsatilmagan"
    const err = await rejectPayment(id, reason)
    setRejectingId(null)
    setRejectReason('')
    if (err) show(`❌ ${err}`)
    else {
      show('Rad etildi')
      load()
    }
  }

  async function handleViewReceipt(p: PaymentRecord) {
    const url = await receiptSignedUrl(p.receiptPath)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!payments) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    )
  }
  if (payments.length === 0) return <p className="text-sm text-muted text-center py-10">To'lovlar yo'q</p>

  return (
    <div className="space-y-3">
      {payments.map(p => (
        <div key={p.id} className="bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display font-bold text-sm text-ink dark:text-ink-dark truncate">{p.userFullName || p.userId}</span>
            <StatusBadge status={p.status} />
          </div>
          {p.userPhone && <p className="text-xs text-muted">{p.userPhone}</p>}
          <p className="text-xs text-muted mt-1">
            {fmt(p.credits)} kredit · {fmt(p.amount)} so'm · {new Date(p.createdAt).toLocaleString('uz-UZ')}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleViewReceipt(p)}
              className="flex items-center gap-1.5 border border-border dark:border-border-dark rounded-lg px-3 py-1.5 text-xs font-semibold text-ink dark:text-ink-dark"
            >
              <Receipt size={13} /> Chek
            </button>
            {p.status === 'pending' && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                  className="w-8 h-8 rounded-lg border border-danger text-danger flex items-center justify-center"
                >
                  <Ban size={14} />
                </button>
                <button onClick={() => handleApprove(p)} className="flex items-center gap-1 bg-primary text-white rounded-lg px-3 py-1.5 text-xs font-bold">
                  <Check size={13} /> Tasdiqlash
                </button>
              </div>
            )}
          </div>

          {rejectingId === p.id && (
            <div className="mt-3 flex gap-2">
              <input
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Rad etish sababi"
                className="flex-1 bg-white dark:bg-transparent border border-border dark:border-border-dark rounded-lg px-3 py-2 text-xs outline-none text-ink dark:text-ink-dark"
              />
              <button onClick={() => handleReject(p.id)} className="bg-danger text-white rounded-lg px-3 text-xs font-bold">
                Rad etish
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function UsersTab() {
  const { show } = useToast()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AppProfile[] | null>(null)

  function load() {
    listProfiles(search).then(setUsers)
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdjustCredits(u: AppProfile) {
    const raw = prompt(`${u.fullName || 'Foydalanuvchi'} — kredit qo'shish/ayirish (masalan 100 yoki -50):`)
    const delta = Number(raw)
    if (!raw || !Number.isFinite(delta) || delta === 0) return
    const err = await addCredits(u.id, delta)
    if (err) show(`❌ ${err}`)
    else {
      show('✅ Yangilandi')
      load()
    }
  }

  async function handleToggleAdmin(u: AppProfile) {
    const nextRole = u.role === 'admin' ? 'user' : 'admin'
    if (!confirm(nextRole === 'admin' ? 'Admin huquqi beriladimi?' : 'Admin huquqi olib tashlanadimi?')) return
    const err = await setRole(u.id, nextRole)
    if (err) show(`❌ ${err}`)
    else load()
  }

  return (
    <div>
      <div className="flex items-center gap-2 bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-3 py-2.5 mb-4">
        <Search size={15} className="text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Ism yoki telefon bo'yicha qidirish"
          className="flex-1 bg-transparent outline-none text-sm text-ink dark:text-ink-dark"
        />
      </div>

      {!users ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">Foydalanuvchi topilmadi</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-primary-light dark:bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {(u.fullName?.[0] || '?').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink dark:text-ink-dark truncate">{u.fullName || 'Nomsiz foydalanuvchi'}</p>
                <p className="text-xs text-muted truncate">
                  {u.phone || ''} · {fmt(u.credits)} kredit · {u.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleAdjustCredits(u)} className="text-xs font-semibold text-primary px-2 py-1">
                  Kredit
                </button>
                <button onClick={() => handleToggleAdmin(u)} className="text-xs font-semibold text-muted px-2 py-1">
                  Rol
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsTab() {
  const { show } = useToast()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings().then(setSettings)
  }, [])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    const err = await updateSettings(settings)
    setSaving(false)
    show(err ? `❌ ${err}` : '✅ Saqlandi')
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2">Bepul limit</h4>
        <input
          type="number"
          value={settings.freeScanLimit}
          onChange={e => setSettings({ ...settings, freeScanLimit: Number(e.target.value) })}
          className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3 text-sm outline-none text-ink dark:text-ink-dark"
        />
      </div>

      <div>
        <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2">To'lov rekviziti</h4>
        <div className="space-y-2">
          <input
            value={settings.paymentCardNumber}
            onChange={e => setSettings({ ...settings, paymentCardNumber: e.target.value })}
            placeholder="Karta raqami"
            className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3 text-sm outline-none text-ink dark:text-ink-dark"
          />
          <input
            value={settings.paymentCardOwner}
            onChange={e => setSettings({ ...settings, paymentCardOwner: e.target.value })}
            placeholder="Karta egasi (F.I.Sh.)"
            className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3 text-sm outline-none text-ink dark:text-ink-dark"
          />
          <input
            value={settings.paymentPhone ?? ''}
            onChange={e => setSettings({ ...settings, paymentPhone: e.target.value || null })}
            placeholder="Click/Payme raqami (ixtiyoriy)"
            className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3 text-sm outline-none text-ink dark:text-ink-dark"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-white rounded-xl py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Saqlash
      </button>
    </div>
  )
}
