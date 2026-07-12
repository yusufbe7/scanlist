-- ScanList mobile — Supabase schema
-- Supabase loyihangizning SQL Editor bo'limida shu faylni to'liq ishga tushiring.
-- Bo'sh (yangi) loyihada xavfsiz tarzda bir marta ishlaydi.

-- ============================================================
-- 1. PROFILES — har bir auth foydalanuvchisi uchun kredit/rol
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  credits integer not null default 0 check (credits >= 0),
  free_scans_used integer not null default 0 check (free_scans_used >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Foydalanuvchi ro'yxatdan o'tganda avtomatik profil yaratish
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- is_admin() — RLS policy'larda qayta-qayta ishlatish uchun yordamchi funksiya
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles: user reads own, admin reads all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: user updates own non-sensitive fields"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- RLS faqat qatorni tanlaydi, ustunlarni emas — shu sababli oddiy foydalanuvchi
-- o'zining role/credits maydonini to'g'ridan-to'g'ri update orqali o'zgartira olmasligi
-- uchun bu maydonlarni faqat admin o'zgartira oladigan qilib qulflaymiz.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.credits := old.credits;
    new.free_scans_used := old.free_scans_used;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_update_guard on public.profiles;
create trigger on_profile_update_guard
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileged_fields();

-- ============================================================
-- 2. APP_SETTINGS — bitta qatorli global sozlama (to'lov rekviziti, limit)
-- ============================================================
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  free_scan_limit integer not null default 50,
  payment_card_number text not null default '0000 0000 0000 0000',
  payment_card_owner text not null default 'F.I.Sh. ko''rsatilmagan',
  payment_phone text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

create policy "app_settings: everyone can read"
  on public.app_settings for select
  using (true);

create policy "app_settings: only admin can update"
  on public.app_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 3. PAYMENTS — foydalanuvchi to'lov chekini yuboradi, admin tasdiqlaydi/rad etadi
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount > 0),           -- so'mda
  credits integer not null check (credits > 0),          -- beriladigan skan krediti
  receipt_path text not null,                            -- Storage'dagi fayl yo'li
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments: user reads own, admin reads all"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

create policy "payments: user creates own pending payment"
  on public.payments for insert
  with check (auth.uid() = user_id and status = 'pending');

create policy "payments: only admin can update status"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

-- Tasdiqlangan to'lov uchun kreditni avtomatik profile'ga qo'shish
create or replace function public.handle_payment_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.profiles set credits = credits + new.credits where id = new.user_id;
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists on_payment_reviewed on public.payments;
create trigger on_payment_reviewed
  before update on public.payments
  for each row execute procedure public.handle_payment_review();

-- ============================================================
-- 4. consume_scan_credit — bitta skanni bepul limit yoki kreditdan yechish
--    (atomik, race-condition'siz)
-- ============================================================
create or replace function public.consume_scan_credit()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_limit integer;
begin
  select free_scan_limit into v_limit from public.app_settings where id = 1;

  select * into v_profile from public.profiles where id = auth.uid() for update;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_profile');
  end if;

  if v_profile.free_scans_used < v_limit then
    update public.profiles
      set free_scans_used = free_scans_used + 1
      where id = auth.uid()
      returning * into v_profile;
    return jsonb_build_object(
      'allowed', true, 'source', 'free',
      'free_scans_used', v_profile.free_scans_used,
      'free_scan_limit', v_limit,
      'credits', v_profile.credits
    );
  elsif v_profile.credits > 0 then
    update public.profiles
      set credits = credits - 1
      where id = auth.uid()
      returning * into v_profile;
    return jsonb_build_object(
      'allowed', true, 'source', 'credit',
      'free_scans_used', v_profile.free_scans_used,
      'free_scan_limit', v_limit,
      'credits', v_profile.credits
    );
  else
    return jsonb_build_object(
      'allowed', false, 'reason', 'no_credits',
      'free_scans_used', v_profile.free_scans_used,
      'free_scan_limit', v_limit,
      'credits', v_profile.credits
    );
  end if;
end;
$$;

grant execute on function public.consume_scan_credit() to authenticated;

-- ============================================================
-- 4b. admin_add_credits — admin qo'lda bonus/tuzatish krediti qo'shishi uchun
-- ============================================================
create or replace function public.admin_add_credits(p_user_id uuid, p_delta integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'faqat admin kredit qo''shishi mumkin';
  end if;
  update public.profiles
    set credits = greatest(0, credits + p_delta)
    where id = p_user_id;
end;
$$;

grant execute on function public.admin_add_credits(uuid, integer) to authenticated;

-- ============================================================
-- 5. STORAGE — to'lov cheklari uchun bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts: user uploads to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "receipts: user reads own, admin reads all"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and ((auth.uid())::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- ============================================================
-- 5b. REALTIME — ilova profil (kredit) o'zgarishini jonli kuzatishi uchun
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- 6. Birinchi adminni tayinlash
-- ============================================================
-- Ilovada oddiy foydalanuvchi sifatida ro'yxatdan o'tgach, quyidagi
-- so'rovni o'z emailingiz bilan ishga tushiring (bir martalik qadam):
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'sizning-emailingiz@example.com');
