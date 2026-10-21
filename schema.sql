-- Technex Official Project Hub — run this entire file in Supabase SQL Editor.
-- Public can read published projects. Only UUIDs explicitly listed in admin_users can write.

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null check (char_length(trim(description)) between 1 and 700),
  project_url text not null check (project_url ~* '^https?://'),
  category text not null default 'Other' check (category in ('Tools','Discord','Web','AI','Utilities','Other')),
  tags text[] not null default '{}',
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.admin_users enable row level security;

-- SECURITY DEFINER avoids recursive RLS when checking the allowlist. No user can add
-- themselves: there is deliberately no INSERT/UPDATE/DELETE policy on admin_users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts" on public.posts
  for select to anon, authenticated using (true);

drop policy if exists "Admins can create posts" on public.posts;
create policy "Admins can create posts" on public.posts
  for insert to authenticated with check (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts" on public.posts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts" on public.posts
  for delete to authenticated using (public.is_admin());

-- The allowlist table itself is not publicly readable or writable. is_admin() is the only check.
revoke all on table public.admin_users from anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;

-- Enable Realtime for posts (safe to run more than once).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;

-- IMPORTANT: after signing up the admin in Authentication, run the separate INSERT
-- command in README.md using that user's real UUID. Never accept an arbitrary UUID from visitors.
