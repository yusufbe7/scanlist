import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSyncConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSyncConfigured
  ? createClient(url as string, anonKey as string)
  : null

/**
 * Cloud sync schema (run in Supabase SQL editor):
 *
 * create table scanlist_lists (
 *   id uuid primary key,
 *   name text not null,
 *   created_at timestamptz not null default now(),
 *   updated_at timestamptz not null default now(),
 *   items jsonb not null default '[]'::jsonb
 * );
 * alter table scanlist_lists enable row level security;
 * create policy "public read/write demo" on scanlist_lists
 *   for all using (true) with check (true);
 *
 * NOTE: the policy above is wide-open for demo/team-shared use.
 * For production, scope rows per store/user with auth.uid().
 */
export async function pushListToCloud(list: {
  id: string
  name: string
  createdAt: string
  items: unknown[]
}) {
  if (!supabase) return { ok: false, error: 'Sync sozlanmagan' }
  const { error } = await supabase.from('scanlist_lists').upsert({
    id: list.id,
    name: list.name,
    created_at: list.createdAt,
    updated_at: new Date().toISOString(),
    items: list.items
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}

export async function pullListsFromCloud() {
  if (!supabase) return { ok: false, error: 'Sync sozlanmagan', data: null }
  const { data, error } = await supabase
    .from('scanlist_lists')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) return { ok: false, error: error.message, data: null }
  return { ok: true, error: null, data }
}
