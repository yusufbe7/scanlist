interface Props {
  open: boolean
  emoji: string
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, emoji, title, message, confirmLabel, danger, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/45 z-[60] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-[340px] text-center">
        <div className="text-3xl">{emoji}</div>
        <h3 className="font-display font-bold text-base mt-2.5 text-ink dark:text-ink-dark">{title}</h3>
        <p className="text-sm text-muted mt-1 mb-5">{message}</p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-surface dark:bg-black/20 text-ink dark:text-ink-dark border border-border dark:border-border-dark"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${danger ? 'bg-danger' : 'bg-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
