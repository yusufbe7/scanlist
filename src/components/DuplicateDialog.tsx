import { useApp } from '../context/AppContext'
import { useToast } from '../hooks/useToast'

export function DuplicateDialog() {
  const { pendingDuplicate, confirmDuplicateIncrement, dismissDuplicate } = useApp()
  const { show } = useToast()

  if (!pendingDuplicate) return null

  return (
    <div className="fixed inset-0 bg-black/45 z-[60] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-[340px] text-center">
        <div className="text-3xl">⚠️</div>
        <h3 className="font-display font-bold text-base mt-2.5 text-ink dark:text-ink-dark">Bu mahsulot allaqachon mavjud</h3>
        <p className="font-mono text-sm text-muted mt-1 mb-1">{pendingDuplicate.code}</p>
        <p className="text-sm text-muted mb-5">Hozirgi miqdor: {pendingDuplicate.existingQty}. Miqdorni oshirilsinmi?</p>
        <div className="flex gap-2.5">
          <button
            onClick={dismissDuplicate}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-surface dark:bg-black/20 text-ink dark:text-ink-dark border border-border dark:border-border-dark"
          >
            Yo'q
          </button>
          <button
            onClick={() => {
              confirmDuplicateIncrement()
              show(`✔ Miqdor oshirildi (x${pendingDuplicate.existingQty + 1})`)
            }}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white"
          >
            Ha, +1
          </button>
        </div>
      </div>
    </div>
  )
}
