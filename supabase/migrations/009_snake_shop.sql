alter table public.profiles
  add column if not exists snake_coins integer not null default 0,
  add column if not exists snake_extra_apples integer not null default 0,
  add column if not exists snake_slow_down boolean not null default false,
  add column if not exists snake_shield boolean not null default false;

alter table public.profiles
  add constraint profiles_snake_coins_non_negative check (snake_coins >= 0);

create or replace function public.snake_earn_coins(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if auth.uid() is null or p_amount <= 0 then
    return null;
  end if;

  update public.profiles
    set snake_coins = snake_coins + p_amount
    where id = auth.uid()
    returning snake_coins into new_balance;
  return new_balance;
end;
$$;

create or replace function public.snake_spend_coins(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if auth.uid() is null or p_amount <= 0 then
    return null;
  end if;

  update public.profiles
    set snake_coins = snake_coins - p_amount
    where id = auth.uid() and snake_coins >= p_amount
    returning snake_coins into new_balance;
  return new_balance;
end;
$$;

revoke all on function public.snake_earn_coins(integer) from public;
revoke all on function public.snake_spend_coins(integer) from public;
grant execute on function public.snake_earn_coins(integer) to authenticated;
grant execute on function public.snake_spend_coins(integer) to authenticated;
