create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  company text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "Users can read own leads" on public.leads;
create policy "Users can read own leads"
on public.leads
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own leads" on public.leads;
create policy "Users can insert own leads"
on public.leads
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own leads" on public.leads;
create policy "Users can update own leads"
on public.leads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own leads" on public.leads;
create policy "Users can delete own leads"
on public.leads
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists leads_user_created_idx
on public.leads (user_id, created_at desc);
