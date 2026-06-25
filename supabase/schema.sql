-- ============================================================
--  Cafe Paradise — Supabase schéma (databáza + práva)
--  Spusti celé v Supabase → SQL Editor → New query → Run.
-- ============================================================

-- 1) Profil používateľa (rola + práva na taby)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff',          -- 'admin' | 'manager' | 'staff'
  permissions jsonb not null default '{}'::jsonb, -- { "sklad":"edit", "plan":"view", ... }
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- 2) Spoločné dáta aplikácie (kľúč -> hodnota). Jedna prevádzka, zdieľané všetkými.
create table if not exists public.app_data (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- 3) Zapni Row Level Security
alter table public.profiles enable row level security;
alter table public.app_data enable row level security;

-- 4) Pomocná funkcia: je prihlásený používateľ admin?
--    SECURITY DEFINER => obchádza RLS, takže nevzniká rekurzia v politikách.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5) Politiky pre profiles
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- 6) Politiky pre app_data (čítať aj písať môže každý prihlásený)
drop policy if exists "appdata_read" on public.app_data;
create policy "appdata_read" on public.app_data
  for select using (auth.role() = 'authenticated');

drop policy if exists "appdata_insert" on public.app_data;
create policy "appdata_insert" on public.app_data
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "appdata_update" on public.app_data;
create policy "appdata_update" on public.app_data
  for update using (auth.role() = 'authenticated');

-- 7) Pri vytvorení nového auth používateľa automaticky založ profil (rola 'staff')
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, role, permissions, is_active)
  values (new.id, new.email, 'staff', '{}'::jsonb, true)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  PRVÝ ADMIN:
--  1. V Supabase → Authentication → Users → "Add user" vytvor svoj účet
--     (email + heslo). Tým sa automaticky založí profil s rolou 'staff'.
--  2. Spusti nasledujúci príkaz (zmeň email na svoj):
--
--     update public.profiles set role = 'admin'
--     where email = 'tvoj@email.sk';
--
--  Odteraz pridávaš ďalších používateľov priamo v appke (sekcia Používatelia).
-- ============================================================
