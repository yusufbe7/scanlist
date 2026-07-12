import { supabase } from './supabaseClient'
import type { AppSettings } from '../types'

export const FALLBACK_SETTINGS: AppSettings = {
  freeScanLimit: 50,
  paymentCardNumber: 'Sozlanmagan',
  paymentCardOwner: 'Sozlanmagan',
  paymentPhone: null
}

export async function fetchSettings(): Promise<AppSettings> {
  if (!supabase) return FALLBACK_SETTINGS
  const { data } = await supabase.from('app_settings').select().eq('id', 1).maybeSingle()
  if (!data) return FALLBACK_SETTINGS
  return {
    freeScanLimit: Number(data.free_scan_limit ?? 50),
    paymentCardNumber: data.payment_card_number ?? '',
    paymentCardOwner: data.payment_card_owner ?? '',
    paymentPhone: data.payment_phone ?? null
  }
}

export async function updateSettings(settings: AppSettings): Promise<string | null> {
  if (!supabase) return 'Supabase sozlanmagan'
  const { error } = await supabase
    .from('app_settings')
    .update({
      free_scan_limit: settings.freeScanLimit,
      payment_card_number: settings.paymentCardNumber,
      payment_card_owner: settings.paymentCardOwner,
      payment_phone: settings.paymentPhone,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
  return error?.message ?? null
}
