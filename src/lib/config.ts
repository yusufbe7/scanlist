import type { CreditTariff } from '../types'

export const RECEIPTS_BUCKET = 'receipts'

/** Sotib olinadigan kredit to'plamlari — narx so'mda, credits: beriladigan skan soni. */
export const TARIFFS: CreditTariff[] = [
  { amount: 15000, credits: 1000 },
  { amount: 30000, credits: 3500 }
]
