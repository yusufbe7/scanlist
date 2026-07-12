import { supabase } from './supabaseClient'
import type { AppProfile } from '../types'

function mapProfile(row: Record<string, unknown>): AppProfile {
  return {
    id: row.id as string,
    fullName: (row.full_name as string) ?? null,
    phone: (row.phone as string) ?? null,
    role: (row.role as 'user' | 'admin') ?? 'user',
    credits: Number(row.credits ?? 0),
    freeScansUsed: Number(row.free_scans_used ?? 0)
  }
}

export async function listProfiles(search?: string): Promise<AppProfile[]> {
  if (!supabase) return []
  let query = supabase.from('profiles').select()
  if (search?.trim()) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  const { data } = await query.order('created_at', { ascending: false })
  return (data ?? []).map(mapProfile)
}

export async function setRole(userId: string, role: 'user' | 'admin'): Promise<string | null> {
  if (!supabase) return 'Supabase sozlanmagan'
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  return error?.message ?? null
}

export async function addCredits(userId: string, delta: number): Promise<string | null> {
  if (!supabase) return 'Supabase sozlanmagan'
  const { error } = await supabase.rpc('admin_add_credits', { p_user_id: userId, p_delta: delta })
  return error?.message ?? null
}
