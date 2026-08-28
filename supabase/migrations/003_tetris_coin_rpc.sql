-- Atomic coin mutations used by the Tetris shop.
create or replace function public.earn_coins(p_amount integer)
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
    set coins = coins + p_amount
    where id = auth.uid()
    returning coins into new_balance;
  return new_balance;
end;
$$;

create or replace function public.spend_coins(p_amount integer)
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
    set coins = coins - p_amount
    where id = auth.uid() and coins >= p_amount
    returning coins into new_balance;
  return new_balance;
end;
$$;

revoke all on function public.earn_coins(integer) from public;
revoke all on function public.spend_coins(integer) from public;
grant execute on function public.earn_coins(integer) to authenticated;
grant execute on function public.spend_coins(integer) to authenticated;