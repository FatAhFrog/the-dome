-- Keeps public.scores capped at the top 10 rows per game.
--
-- Always inserts the new score (cheap, and avoids a race where two players
-- submit at the same instant and both read a stale "10th place" threshold),
-- then deletes anything outside the top 10 for that game. Returns true when
-- the submitted score actually landed in the top 10, false otherwise, so
-- the client can show a "new high score!" state if it wants to.
create or replace function public.submit_game_score(p_game text, p_score integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_id uuid;
  v_made_top_10 boolean := false;
begin
  if v_user_id is null or p_score is null or p_score <= 0 then
    return false;
  end if;

  -- Mirrors the "banned users cannot insert scores" RLS policy — this
  -- function runs as SECURITY DEFINER, so RLS is bypassed and the check
  -- has to be re-applied here explicitly.
  if exists (select 1 from public.profiles where id = v_user_id and is_banned = true) then
    return false;
  end if;

  insert into public.scores (user_id, game, score)
  values (v_user_id, p_game, p_score)
  returning id into v_new_id;

  select exists (
    select 1 from (
      select id, row_number() over (order by score desc, created_at asc) as rn
      from public.scores
      where game = p_game
    ) ranked
    where ranked.id = v_new_id and ranked.rn <= 10
  ) into v_made_top_10;

  delete from public.scores
  where id in (
    select id from public.scores
    where game = p_game
    order by score desc, created_at asc
    offset 10
  );

  return v_made_top_10;
end;
$$;

revoke all on function public.submit_game_score(text, integer) from public;
grant execute on function public.submit_game_score(text, integer) to authenticated;
