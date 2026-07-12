import type { PaymentStatus } from '../types'

const CONFIG: Record<PaymentStatus, { label: string; classes: string }> = {
  pending: { label: 'Kutilmoqda', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  approved: { label: 'Tasdiqlangan', classes: 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary' },
  rejected: { label: 'Rad etilgan', classes: 'bg-danger-light text-danger dark:bg-danger/20 dark:text-danger' }
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = CONFIG[status]
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.classes}`}>{cfg.label}</span>
}
