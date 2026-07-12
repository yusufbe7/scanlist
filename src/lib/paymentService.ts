import { supabase } from './supabaseClient'
import { RECEIPTS_BUCKET } from './config'
import type { CreditTariff, PaymentRecord, PaymentStatus } from '../types'

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  const profileRow = row.profiles as Record<string, unknown> | null | undefined
  return {
    id: row.id as string,
    userId: row.user_id as string,
    amount: Number(row.amount),
    credits: Number(row.credits),
    receiptPath: row.receipt_path as string,
    status: row.status as PaymentStatus,
    rejectReason: (row.reject_reason as string) ?? null,
    createdAt: row.created_at as string,
    reviewedAt: (row.reviewed_at as string) ?? null,
    userFullName: profileRow?.full_name as string | undefined,
    userPhone: profileRow?.phone as string | undefined
  }
}

export async function submitPayment(userId: string, tariff: CreditTariff, receiptFile: File): Promise<string | null> {
  if (!supabase) return 'Supabase sozlanmagan'
  const ext = receiptFile.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const upload = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, receiptFile)
  if (upload.error) return upload.error.message

  const insert = await supabase.from('payments').insert({
    user_id: userId,
    amount: tariff.amount,
    credits: tariff.credits,
    receipt_path: path,
    status: 'pending'
  })
  return insert.error?.message ?? null
}

export async function receiptSignedUrl(path: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, 600)
  return data?.signedUrl ?? null
}

export async function myPayments(userId: string): Promise<PaymentRecord[]> {
  if (!supabase) return []
  const { data } = await supabase.from('payments').select().eq('user_id', userId).order('created_at', { ascending: false })
  return (data ?? []).map(mapPayment)
}

export async function allPayments(statusFilter?: PaymentStatus): Promise<PaymentRecord[]> {
  if (!supabase) return []
  let query = supabase.from('payments').select('*, profiles(full_name, phone)')
  if (statusFilter) query = query.eq('status', statusFilter)
  const { data } = await query.order('created_at', { ascending: false })
  return (data ?? []).map(mapPayment)
}

export async function approvePayment(id: string): Promise<string | null> {
  if (!supabase) return 'Supabase sozlanmagan'
  const { error } = await supabase.from('payments').update({ status: 'approved' }).eq('id', id)
  return error?.message ?? null
}

export async function rejectPayment(id: string, reason: string): Promise<string | null> {
  if (!supabase) return 'Supabase sozlanmagan'
  const { error } = await supabase.from('payments').update({ status: 'rejected', reject_reason: reason }).eq('id', id)
  return error?.message ?? null
}
