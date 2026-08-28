-- Prevent banned users from inserting data even while an old auth token remains valid.
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

create policy "banned users cannot insert messages"
  on public.messages as restrictive for insert
  with check (
    auth.uid() = user_id
    and
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_banned = true
    )
  );

create policy "banned users cannot insert scores"
  on public.scores as restrictive for insert
  with check (
    auth.uid() = user_id
    and
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_banned = true
    )
  );