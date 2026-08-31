alter table public.scores drop constraint if exists scores_game_check;
alter table public.scores add constraint scores_game_check
  check (game in ('snake', 'tetris', 'minesweeper', 'dino'));

alter table public.scores add column if not exists meta jsonb;
