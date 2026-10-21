-- Technex v2: free/paid projects, access keys, purchase requests, visitor log.
-- Run this whole file in Supabase SQL Editor AFTER schema.sql. Safe to re-run.
alter table public.posts add column if not exists access_type text not null default 'free';
alter table public.posts add column if not exists price_text text;
alter table public.posts alter column project_url drop not null;
alter table public.posts drop constraint if exists posts_access_chk;
alter table public.posts add constraint posts_access_chk check ((access_type='free' and project_url is not null) or (access_type='paid' and project_url is null));

create table if not exists public.project_private (project_id uuid primary key references public.posts(id) on delete cascade, secret_url text not null check (secret_url ~* '^https?://'));
create table if not exists public.access_keys (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.posts(id) on delete cascade, key_code text not null unique, label text, status text not null default 'active' check (status in ('active','revoked')), max_devices int not null default 2 check (max_devices between 1 and 20), created_at timestamptz not null default now());
create table if not exists public.key_uses (id uuid primary key default gen_random_uuid(), key_id uuid not null references public.access_keys(id) on delete cascade, device_id text not null, country text, city text, first_used timestamptz not null default now(), last_used timestamptz not null default now(), unique (key_id, device_id));
create table if not exists public.purchase_requests (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.posts(id) on delete cascade, contact text not null, tx_hash text, proof_path text not null, request_code text not null unique, status text not null default 'pending' check (status in ('pending','approved','rejected')), key_id uuid references public.access_keys(id) on delete set null, admin_note text, country text, city text, created_at timestamptz not null default now(), reviewed_at timestamptz);
create table if not exists public.site_visits (id bigint generated always as identity primary key, visitor_id text, country text, city text, created_at timestamptz not null default now());

-- Admin-only tables: no access for visitors at all (they use the functions below).
do $$ declare t text; begin
  foreach t in array array['project_private','access_keys','key_uses','purchase_requests','site_visits'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Private bucket for payment screenshots: anyone can upload, only admin can view.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs','payment-proofs',false,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "proof upload" on storage.objects;
create policy "proof upload" on storage.objects for insert to anon, authenticated with check (bucket_id='payment-proofs');
drop policy if exists "proof admin read" on storage.objects;
create policy "proof admin read" on storage.objects for select to authenticated using (bucket_id='payment-proofs' and public.is_admin());
drop policy if exists "proof admin delete" on storage.objects;
create policy "proof admin delete" on storage.objects for delete to authenticated using (bucket_id='payment-proofs' and public.is_admin());

-- ===== Public functions =====
create or replace function public.log_visit(p_visitor text, p_country text, p_city text) returns void
language sql security definer set search_path='' as $$
  insert into public.site_visits (visitor_id, country, city) values (left(p_visitor,64), left(p_country,8), left(p_city,80));
$$;

create or replace function public.submit_purchase(p_project uuid, p_contact text, p_tx text, p_proof text, p_country text default null, p_city text default null)
returns text language plpgsql security definer set search_path='' as $$
declare v_code text;
begin
  if not exists (select 1 from public.posts where id=p_project and access_type='paid') then raise exception 'Invalid project'; end if;
  if char_length(trim(coalesce(p_contact,''))) not between 3 and 200 then raise exception 'Enter a valid contact (email or Discord)'; end if;
  if p_proof is null or p_proof !~ '^[0-9a-f-]{36}\.(png|jpg|webp)$' then raise exception 'Screenshot required'; end if;
  if (select count(*) from public.purchase_requests where lower(contact)=lower(trim(p_contact)) and status='pending') >= 3 then raise exception 'Too many pending requests'; end if;
  v_code := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.purchase_requests (project_id, contact, tx_hash, proof_path, request_code, country, city)
  values (p_project, trim(p_contact), left(p_tx,200), p_proof, v_code, left(p_country,8), left(p_city,80));
  return v_code;
end $$;

create or replace function public.check_purchase(p_code text)
returns table (status text, access_key text, admin_note text, project_title text)
language sql stable security definer set search_path='' as $$
  select r.status, case when r.status='approved' then k.key_code end, r.admin_note, p.title
  from public.purchase_requests r join public.posts p on p.id=r.project_id
  left join public.access_keys k on k.id=r.key_id
  where r.request_code = p_code;
$$;

-- A key works only for its project, only while active, and only on max_devices devices.
create or replace function public.redeem_key(p_key text, p_project uuid, p_device text, p_country text, p_city text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare k public.access_keys; u text;
begin
  if char_length(coalesce(p_device,'')) not between 8 and 64 then return jsonb_build_object('ok',false,'reason','invalid'); end if;
  select * into k from public.access_keys where key_code=upper(trim(p_key)) and project_id=p_project and status='active' for update;
  if not found then return jsonb_build_object('ok',false,'reason','invalid'); end if;
  select secret_url into u from public.project_private where project_id=p_project;
  if u is null then return jsonb_build_object('ok',false,'reason','invalid'); end if;
  if exists (select 1 from public.key_uses where key_id=k.id and device_id=p_device) then
    update public.key_uses set last_used=now(), country=left(p_country,8), city=left(p_city,80) where key_id=k.id and device_id=p_device;
  elsif (select count(*) from public.key_uses where key_id=k.id) >= k.max_devices then
    return jsonb_build_object('ok',false,'reason','device_limit');
  else
    insert into public.key_uses (key_id, device_id, country, city) values (k.id, p_device, left(p_country,8), left(p_city,80));
  end if;
  return jsonb_build_object('ok',true,'url',u);
end $$;

-- ===== Admin functions =====
create or replace function public.admin_generate_key(p_project uuid, p_label text, p_max_devices int default 2)
returns text language plpgsql security definer set search_path='' as $$
declare h text; k text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  h := upper(replace(gen_random_uuid()::text,'-',''));
  k := 'TNX-'||substr(h,1,6)||'-'||substr(h,7,6)||'-'||substr(h,18,6)||'-'||substr(h,24,6);
  insert into public.access_keys (project_id, key_code, label, max_devices)
  values (p_project, k, left(p_label,80), greatest(1, least(coalesce(p_max_devices,2),20)));
  return k;
end $$;

create or replace function public.admin_approve_purchase(p_request uuid, p_note text, p_max_devices int default 2)
returns text language plpgsql security definer set search_path='' as $$
declare r public.purchase_requests; k text; kid uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into r from public.purchase_requests where id=p_request and status='pending' for update;
  if not found then raise exception 'Request is not pending'; end if;
  k := public.admin_generate_key(r.project_id, r.contact, p_max_devices);
  select id into kid from public.access_keys where key_code=k;
  update public.purchase_requests set status='approved', key_id=kid, admin_note=left(p_note,300), reviewed_at=now() where id=r.id;
  return k;
end $$;

revoke all on function public.log_visit(text,text,text), public.submit_purchase(uuid,text,text,text,text,text), public.check_purchase(text), public.redeem_key(text,uuid,text,text,text), public.admin_generate_key(uuid,text,int), public.admin_approve_purchase(uuid,text,int) from public;
grant execute on function public.log_visit(text,text,text), public.submit_purchase(uuid,text,text,text,text,text), public.check_purchase(text), public.redeem_key(text,uuid,text,text,text) to anon, authenticated;
grant execute on function public.admin_generate_key(uuid,text,int), public.admin_approve_purchase(uuid,text,int) to authenticated;
