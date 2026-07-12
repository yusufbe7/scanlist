export function PaywallDialog({ open, onBuyCredits, onClose }: { open: boolean; onBuyCredits: () => void; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/45 z-[65] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-[340px] text-center">
        <div className="text-3xl">⏳</div>
        <h3 className="font-display font-bold text-base mt-2.5 text-ink dark:text-ink-dark">Kredit tugadi</h3>
        <p className="text-sm text-muted mt-1 mb-5">
          Bepul skanerlar va sotib olingan kreditlaringiz tugadi. Davom etish uchun kredit sotib oling.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-surface dark:bg-black/20 text-ink dark:text-ink-dark border border-border dark:border-border-dark"
          >
            Yopish
          </button>
          <button onClick={onBuyCredits} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-primary">
            Kredit sotib olish
          </button>
        </div>
      </div>
    </div>
  )
}
