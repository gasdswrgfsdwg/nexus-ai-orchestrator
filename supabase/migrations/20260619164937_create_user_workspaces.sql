create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1 check (schema_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_workspaces is
  'Workspace portatil do Nexus Editais, isolado por usuario autenticado.';

alter table public.user_workspaces enable row level security;

revoke all on table public.user_workspaces from anon;
grant select, insert, update on table public.user_workspaces to authenticated;

drop policy if exists "usuarios leem o proprio workspace" on public.user_workspaces;
create policy "usuarios leem o proprio workspace"
on public.user_workspaces
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "usuarios criam o proprio workspace" on public.user_workspaces;
create policy "usuarios criam o proprio workspace"
on public.user_workspaces
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "usuarios atualizam o proprio workspace" on public.user_workspaces;
create policy "usuarios atualizam o proprio workspace"
on public.user_workspaces
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
