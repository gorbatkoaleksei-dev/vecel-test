create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'client')
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, role)
select id, email, 'client'
from auth.users
on conflict (id) do update
  set email = excluded.email;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  company text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  note text,
  admin_note text,
  created_at timestamptz not null default now()
);

alter table public.leads add column if not exists admin_note text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_user_profile_fkey'
  ) then
    alter table public.leads
    add constraint leads_user_profile_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end;
$$;

alter table public.leads enable row level security;

drop policy if exists "Users can read own leads" on public.leads;
drop policy if exists "Users can insert own leads" on public.leads;
drop policy if exists "Users can update own leads" on public.leads;
drop policy if exists "Users can delete own leads" on public.leads;
drop policy if exists "Clients and admins can read leads" on public.leads;
drop policy if exists "Clients can create own leads" on public.leads;
drop policy if exists "Admins can update all leads" on public.leads;
drop policy if exists "Admins can delete all leads" on public.leads;

create policy "Clients and admins can read leads"
on public.leads
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "Clients can create own leads"
on public.leads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Admins can update all leads"
on public.leads
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete all leads"
on public.leads
for delete
to authenticated
using (public.is_admin());

create index if not exists leads_user_created_idx
on public.leads (user_id, created_at desc);

create index if not exists profiles_role_idx
on public.profiles (role);

-- After you sign in once, make yourself admin by replacing the email below.
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-email@example.com';
