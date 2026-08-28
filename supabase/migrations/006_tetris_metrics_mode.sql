-- Dev-facing per-second Tetris metrics, toggled from Profile.
alter table public.profiles
  add column if not exists metrics_mode_tetris boolean not null default false;
