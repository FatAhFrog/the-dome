alter table public.profiles
  add column if not exists snake_extra_apples integer not null default 0,
  add column if not exists snake_slow_down boolean not null default false,
  add column if not exists snake_shield boolean not null default false,
  add column if not exists snake_active_theme text;

create table if not exists public.snake_theme_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_key text not null,
  custom_name text not null,
  purchased_at timestamptz not null default now(),
  unique (user_id, theme_key)
);

alter table public.snake_theme_purchases enable row level security;

create policy "Users can view their own Snake theme purchases"
  on public.snake_theme_purchases for select
  using (auth.uid() = user_id);

create policy "Users can buy Snake themes for themselves"
  on public.snake_theme_purchases for insert
  with check (auth.uid() = user_id);
