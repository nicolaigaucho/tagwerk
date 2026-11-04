-- Tagwerk: einmalig im Supabase SQL-Editor ausführen.
create table if not exists public.docs (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  path text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);
alter table public.docs enable row level security;
drop policy if exists "eigene Daten" on public.docs;
create policy "eigene Daten" on public.docs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.docs replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;
