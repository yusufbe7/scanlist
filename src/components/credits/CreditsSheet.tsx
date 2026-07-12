import { useEffect, useState } from 'react'
import { X, ArrowLeft, Diamond, Camera, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import { TARIFFS } from '../../lib/config'
import { fetchSettings } from '../../lib/settingsService'
import { myPayments, submitPayment } from '../../lib/paymentService'
import type { AppSettings, CreditTariff, PaymentRecord } from '../../types'
import { StatusBadge } from '../StatusBadge'

type Step = 'overview' | 'tariff' | 'upload' | 'history'

const fmt = (n: number) => n.toLocaleString('uz-UZ')

export function CreditsSheet({
  open,
  initialStep = 'overview',
  onClose,
  onOpenAdmin
}: {
  open: boolean
  initialStep?: Step
  onClose: () => void
  onOpenAdmin: () => void
}) {
  const { user, profile, isAdmin } = useAuth()
  const { show } = useToast()
  const [step, setStep] = useState<Step>('overview')
  const [selectedTariff, setSelectedTariff] = useState<CreditTariff | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null)

  useEffect(() => {
    if (open) setStep(initialStep)
  }, [open, initialStep])

  useEffect(() => {
    if (step === 'upload') fetchSettings().then(setSettings)
    if (step === 'history' && user) myPayments(user.id).then(setPayments)
  }, [step, user])

  if (!open) return null

  async function handleSubmitPayment() {
    if (!user || !selectedTariff || !receiptFile) return
    setSubmitting(true)
    const err = await submitPayment(user.id, selectedTariff, receiptFile)
    setSubmitting(false)
    if (err) {
      show(`❌ ${err}`)
      return
    }
    show("✅ To'lov yuborildi! Admin tasdiqlashini kuting.")
    setReceiptFile(null)
    setStep('history')
  }

  return (
    <div className="fixed inset-0 bg-black/45 z-[60] flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border-dark sticky top-0 bg-white dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            {step !== 'overview' && (
              <button onClick={() => setStep('overview')} className="w-8 h-8 rounded-full bg-surface dark:bg-black/20 flex items-center justify-center">
                <ArrowLeft size={15} />
              </button>
            )}
            <h3 className="font-display font-bold text-base text-ink dark:text-ink-dark">
              {step === 'overview' && 'Kredit'}
              {step === 'tariff' && 'Kredit sotib olish'}
              {step === 'upload' && "To'lov"}
              {step === 'history' && 'Mening to\'lovlarim'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface dark:bg-black/20 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {step === 'overview' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white">
                <p className="text-xs font-semibold text-white/75">Joriy balans</p>
                <p className="font-display font-extrabold text-3xl mt-1">{fmt(profile?.credits ?? 0)} kredit</p>
                <p className="text-xs text-white/75 mt-1">Bepul skanerlar: {fmt(profile?.freeScansUsed ?? 0)} ta ishlatilgan</p>
              </div>
              <button
                onClick={() => setStep('tariff')}
                className="w-full bg-primary text-white rounded-xl py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <Diamond size={16} /> Kredit sotib olish
              </button>
              <button
                onClick={() => setStep('history')}
                className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark text-ink dark:text-ink-dark rounded-xl py-3.5 font-semibold text-sm"
              >
                Mening to'lovlarim
              </button>
              {isAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="w-full flex items-center justify-center gap-2 border border-border dark:border-border-dark text-ink dark:text-ink-dark rounded-xl py-3.5 font-semibold text-sm"
                >
                  <ShieldCheck size={16} /> Admin panel
                </button>
              )}
            </div>
          )}

          {step === 'tariff' && (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Tarifni tanlang, to'lovni amalga oshiring va chek rasmini yuklang. Admin tekshirib tasdiqlagach, kreditlar hisobingizga qo'shiladi.
              </p>
              {TARIFFS.map(t => (
                <button
                  key={t.amount}
                  onClick={() => {
                    setSelectedTariff(t)
                    setStep('upload')
                  }}
                  className="w-full flex items-center gap-3 bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-4 text-left active:scale-[0.98] transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center shrink-0">
                    <Camera size={22} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-ink dark:text-ink-dark">{fmt(t.credits)} ta skan krediti</p>
                    <p className="text-primary font-bold text-sm">{fmt(t.amount)} so'm</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'upload' && selectedTariff && (
            <div className="space-y-4">
              <div className="bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-4 text-sm font-semibold text-ink dark:text-ink-dark">
                {fmt(selectedTariff.credits)} kredit · {fmt(selectedTariff.amount)} so'm
              </div>

              {!settings ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-muted" />
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2">1-qadam: to'lovni amalga oshiring</h4>
                  <div className="bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-4 space-y-1.5 text-sm">
                    <Row label="Karta raqami" value={settings.paymentCardNumber} />
                    <Row label="Karta egasi" value={settings.paymentCardOwner} />
                    {settings.paymentPhone && <Row label="Click/Payme" value={settings.paymentPhone} />}
                    <p className="text-xs text-muted pt-1">Yuqoridagi rekvizitga {fmt(selectedTariff.amount)} so'm o'tkazing.</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2">2-qadam: chek rasmini yuklang</h4>
                {receiptFile && (
                  <img src={URL.createObjectURL(receiptFile)} alt="chek" className="w-full max-h-48 object-cover rounded-xl mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:px-3 file:py-2 file:text-xs file:font-semibold"
                />
              </div>

              <button
                onClick={handleSubmitPayment}
                disabled={!receiptFile || submitting}
                className="w-full bg-primary text-white rounded-xl py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Adminga yuborish
              </button>
            </div>
          )}

          {step === 'history' && (
            <div className="space-y-3">
              {!payments ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-muted" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">Hali to'lovlar yo'q</p>
              ) : (
                payments.map(p => (
                  <div key={p.id} className="bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-sm text-ink dark:text-ink-dark">{fmt(p.credits)} kredit</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {fmt(p.amount)} so'm · {new Date(p.createdAt).toLocaleString('uz-UZ')}
                    </p>
                    {p.status === 'rejected' && p.rejectReason && <p className="text-xs text-danger mt-1.5">Sabab: {p.rejectReason}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 font-semibold text-ink dark:text-ink-dark">{label}</span>
      <span className="font-mono text-ink dark:text-ink-dark break-all">{value}</span>
    </div>
  )
}
