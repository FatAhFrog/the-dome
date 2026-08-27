-- Tetris Shop: coins, upgrades, and purchasable Dome themes.
alter table public.profiles
  add column if not exists coins integer not null default 0,
  add column if not exists active_theme text not null default 'dome',
  add column if not exists tetris_upgrade_low_spawn boolean not null default false,
  add column if not exists tetris_upgrade_speed_level integer not null default 0,
  add column if not exists tetris_upgrade_ghost boolean not null default false,
  add column if not exists tetris_upgrade_hold boolean not null default false;

alter table public.profiles
  add constraint profiles_coins_non_negative check (coins >= 0);

create table if not exists public.theme_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_key text not null,
  custom_name text not null,
  purchased_at timestamptz not null default now(),
  unique (user_id, theme_key)
);

alter table public.theme_purchases enable row level security;

create policy "Users can view their own theme purchases"
  on public.theme_purchases for select
  using (auth.uid() = user_id);

create policy "Users can buy themes for themselves"
  on public.theme_purchases for insert
  with check (auth.uid() = user_id);
