alter table public.profiles
  add column if not exists snake_crown_enabled boolean not null default true,
  add column if not exists snake_crown_color_mode text not null default 'default',
  add column if not exists snake_crown_color text;

alter table public.profiles
  add constraint profiles_snake_crown_color_mode_check
  check (snake_crown_color_mode in ('default', 'custom'));
