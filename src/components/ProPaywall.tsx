import { Crown, Send, X } from 'lucide-react'
import { FREE_SCAN_LIMIT, PRO_PRICE, TELEGRAM_LINK, TELEGRAM_CONTACT } from '../lib/userManager'
import type { UserProfile } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  user: UserProfile
}

export function ProPaywall({ open, onClose, user }: Props) {
  if (!open) return null

  function handlePayment() {
    const message = `Salom! Men ScanList Pro sotib olmoqchiman.%0A%0AID: ${user.id}%0AIsm: ${user.name}%0A%0APro narxi: ${PRO_PRICE} so'm / 1 oy`
    window.open(`${TELEGRAM_LINK}?text=${message}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] glass rounded-3xl p-6 relative animate-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"
        >
          <X size={14} />
        </button>

        {/* Crown icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Crown size={24} className="text-white" />
        </div>

        <h2 className="font-display font-extrabold text-xl text-ink dark:text-ink-dark text-center mb-2">
          Pro rejimga o'ting
        </h2>

        <p className="text-sm text-muted dark:text-muted-dark text-center mb-6">
          Sizning bepul {FREE_SCAN_LIMIT} ta scan limitingiz tugadi.
          Pro rejimda cheksiz scan qiling!
        </p>

        {/* Features */}
        <div className="bg-white/50 dark:bg-white/5 rounded-xl p-4 mb-6 space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-500">✓</span>
            <span className="text-ink dark:text-ink-dark">Cheksiz barcode scan</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-500">✓</span>
            <span className="text-ink dark:text-ink-dark">Uzluksiz scan rejimi</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-500">✓</span>
            <span className="text-ink dark:text-ink-dark">Excel/Word eksport</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-500">✓</span>
            <span className="text-ink dark:text-ink-dark">Bulutga sinxronizatsiya</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-4">
          <span className="font-display font-extrabold text-3xl text-ink dark:text-ink-dark">
            {PRO_PRICE}
          </span>
          <span className="text-muted dark:text-muted-dark text-sm ml-1">so'm / oy</span>
        </div>

        {/* Payment button */}
        <button
          onClick={handlePayment}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
            text-white rounded-xl py-3.5 font-display font-bold text-sm
            flex items-center justify-center gap-2
            active:scale-[0.97] transition-all shadow-lg"
        >
          <Send size={16} />
          Telegram orqali to'lash
        </button>

        <p className="text-[11px] text-muted dark:text-muted-dark text-center mt-3">
          {TELEGRAM_CONTACT} ga yozing · To'lovdan so'ng Pro faollashtiriladi
        </p>

        {/* User ID */}
        <div className="mt-4 bg-surface dark:bg-black/20 rounded-lg px-3 py-2 text-center">
          <span className="text-[10px] text-muted block">Sizning ID:</span>
          <span className="font-mono text-xs font-bold text-ink dark:text-ink-dark">{user.id}</span>
        </div>
      </div>
    </div>
  )
}
