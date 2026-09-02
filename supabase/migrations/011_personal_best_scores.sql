-- Keep one highest (or lowest for Minesweeper) score per player and game.
-- Existing duplicate rows are normalized before the submission function changes.
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, game
      order by
        case when game = 'minesweeper' then score end asc,
        case when game <> 'minesweeper' then score end desc,
        created_at asc
    ) as rn
  from public.scores
)
delete from public.scores as scores
using ranked
where scores.id = ranked.id
  and ranked.rn > 1;

create or replace function public.submit_game_score(p_game text, p_score integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous_score integer;
  v_new_id uuid;
  v_made_top_10 boolean := false;
begin
  if v_user_id is null or p_score is null or p_score <= 0 then
    return false;
  end if;

  if exists (select 1 from public.profiles where id = v_user_id and is_banned = true) then
    return false;
  end if;

  select score into v_previous_score
  from public.scores
  where user_id = v_user_id and game = p_game
  order by
    case when p_game = 'minesweeper' then score end asc,
    case when p_game <> 'minesweeper' then score end desc,
    created_at asc
  limit 1;

  if v_previous_score is not null and (
    (p_game = 'minesweeper' and p_score >= v_previous_score)
    or (p_game <> 'minesweeper' and p_score <= v_previous_score)
  ) then
    return false;
  end if;

  delete from public.scores
  where user_id = v_user_id and game = p_game;

  insert into public.scores (user_id, game, score)
  values (v_user_id, p_game, p_score)
  returning id into v_new_id;

  select exists (
    select 1
    from (
      select id,
        row_number() over (
          order by
            case when p_game = 'minesweeper' then score end asc,
            case when p_game <> 'minesweeper' then score end desc,
            created_at asc
        ) as rn
      from public.scores
      where game = p_game
    ) ranked
    where ranked.id = v_new_id and ranked.rn <= 10
  ) into v_made_top_10;

  with ranked as (
    select id,
      row_number() over (
        partition by game
        order by
          case when game = 'minesweeper' then score end asc,
          case when game <> 'minesweeper' then score end desc,
          created_at asc
      ) as rn
    from public.scores
  )
  delete from public.scores as scores
  using ranked
  where scores.id = ranked.id
    and ranked.rn > 10;

  return v_made_top_10;
end;
$$;

create or replace function public.get_top_scores(p_game text)
returns table(score integer, created_at timestamptz, username text)
language sql
security definer
set search_path = public
as $$
  select best.score, best.created_at, profiles.username
  from (
    select distinct on (scores.user_id)
      scores.user_id,
      scores.score,
      scores.created_at
    from public.scores as scores
    where scores.game = p_game
    order by
      scores.user_id,
      case when p_game = 'minesweeper' then scores.score end asc,
      case when p_game <> 'minesweeper' then scores.score end desc,
      scores.created_at asc
  ) as best
  left join public.profiles as profiles on profiles.id = best.user_id
  order by
    case when p_game = 'minesweeper' then best.score end asc,
    case when p_game <> 'minesweeper' then best.score end desc,
    best.created_at asc
  limit 10;
$$;

revoke all on function public.get_top_scores(text) from public;
grant execute on function public.get_top_scores(text) to anon, authenticated;
