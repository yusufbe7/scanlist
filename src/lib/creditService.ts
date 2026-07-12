import { supabase } from './supabaseClient'

export interface ScanCreditResult {
  allowed: boolean
  reason?: 'no_credits' | 'no_profile'
  source?: 'free' | 'credit'
  freeScansUsed?: number
  freeScanLimit?: number
  credits?: number
}

/** Har bir skan uchun serverdagi consume_scan_credit() ni chaqiradi (atomik). */
export async function consumeScanCredit(): Promise<ScanCreditResult> {
  if (!supabase) return { allowed: false, reason: 'no_profile' }
  const { data, error } = await supabase.rpc('consume_scan_credit')
  if (error || !data) return { allowed: false, reason: 'no_profile' }
  return {
    allowed: Boolean(data.allowed),
    reason: data.reason,
    source: data.source,
    freeScansUsed: data.free_scans_used,
    freeScanLimit: data.free_scan_limit,
    credits: data.credits
  }
}
