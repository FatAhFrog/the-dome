-- Optional saved weather place. NULL means use Springdale default + optional GPS.
alter table public.profiles
  add column if not exists weather_lat double precision,
  add column if not exists weather_lon double precision,
  add column if not exists weather_label text;
