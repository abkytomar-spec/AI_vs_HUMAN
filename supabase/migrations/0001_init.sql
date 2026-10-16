-- Real or Rendered: server mode schema (Supabase / Postgres).
-- Answers stay in the database: clients only receive image ids and alt text until
-- they submit, rounds can be answered once, and points are computed here.

create table if not exists images (
  id text primary key check (id ~ '^[0-9a-f]{16}$'),
  alt text not null,
  category text not null,
  grp text not null,
  origin text not null check (origin in ('ai', 'human')),
  difficulty text check (difficulty in ('warmup', 'intermediate', 'expert', 'blind')),
  note text not null,
  clues text[] not null default '{}',
  no_reliable_tell boolean not null default false,
  source jsonb not null
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  mode text not null,
  created_at timestamptz not null default now()
);

create table if not exists session_rounds (
  session_id uuid references sessions(id) on delete cascade,
  round_id text not null,
  position int not null,
  difficulty text not null,
  image_ids text[] not null,
  ai_image_id text not null,
  answered_image_id text,
  points int,
  primary key (session_id, round_id)
);

-- No direct table access for the anon role; everything goes through the functions below.
alter table images enable row level security;
alter table sessions enable row level security;
alter table session_rounds enable row level security;

create or replace function create_session(p_mode text, p_seen text[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_session uuid;
  v_plan jsonb := case p_mode
    when 'classic' then '[["warmup",2],["intermediate",3],["expert",3],["blind",2]]'
    else jsonb_build_array(jsonb_build_array(p_mode, 5)) end;
  v_step jsonb; v_ai record; v_humans text[]; v_order text[]; v_pos int := 0; v_round text;
  v_used text[] := '{}'; v_rounds jsonb := '[]';
begin
  if p_mode not in ('classic','warmup','intermediate','expert','blind') then raise exception 'unknown mode'; end if;
  insert into sessions(mode) values (p_mode) returning id into v_session;
  for v_step in select * from jsonb_array_elements(v_plan) loop
    for v_ai in
      select * from images i
      where i.origin = 'ai' and i.difficulty = v_step->>0
      order by (i.id = any(p_seen)), random()
      limit (v_step->>1)::int
    loop
      select array_agg(id) into v_humans from (
        select id from images h where h.origin = 'human' and h.grp = v_ai.grp and not (h.id = any(v_used))
        order by (h.id = any(p_seen)), random() limit 2) t;
      continue when coalesce(array_length(v_humans, 1), 0) < 2;
      v_order := v_humans[1:2];
      v_order := v_order[1:(floor(random()*3))::int] || v_ai.id || v_order[(floor(random()*3))::int + 1:];
      v_order := (select array_agg(x) from unnest(v_order) x);
      if array_length(v_order,1) <> 3 then v_order := array[v_humans[1], v_ai.id, v_humans[2]]; end if;
      v_pos := v_pos + 1;
      v_round := 'r' || v_pos || '-' || left(v_ai.id, 6);
      v_used := v_used || v_order;
      insert into session_rounds values (v_session, v_round, v_pos, v_ai.difficulty, v_order, v_ai.id, null, null);
      v_rounds := v_rounds || jsonb_build_object(
        'round', jsonb_build_object('id', v_round, 'difficulty', v_ai.difficulty, 'category', v_ai.category),
        'images', (select jsonb_agg(jsonb_build_object('id', im.id, 'alt', im.alt) order by array_position(v_order, im.id)) from images im where im.id = any(v_order)));
    end loop;
  end loop;
  return jsonb_build_object('session_id', v_session, 'rounds', v_rounds);
end $$;

create or replace function submit_answer(p_session_id uuid, p_round_id text, p_image_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r session_rounds; v_streak int; v_correct boolean; v_points int; v_mult numeric;
begin
  select * into r from session_rounds where session_id = p_session_id and round_id = p_round_id for update;
  if not found then raise exception 'round not in session'; end if;
  if r.answered_image_id is not null then raise exception 'round already answered'; end if;
  if not (p_image_id = any(r.image_ids)) then raise exception 'image not in round'; end if;
  v_correct := p_image_id = r.ai_image_id;
  -- streak before this round = consecutive correct answers in earlier positions
  select count(*) into v_streak from (
    select points > 0 as ok, position from session_rounds
    where session_id = p_session_id and position < r.position and answered_image_id is not null
    order by position desc) s
  where ok and position > coalesce((select max(position) from session_rounds where session_id = p_session_id and position < r.position and points = 0), 0);
  v_mult := case r.difficulty when 'warmup' then 1 when 'intermediate' then 1.25 when 'expert' then 1.5 else 2 end;
  v_points := case when v_correct then round(100 * v_mult) + least(v_streak * 10, 50) else 0 end;
  update session_rounds set answered_image_id = p_image_id, points = v_points where session_id = p_session_id and round_id = p_round_id;
  return jsonb_build_object(
    'round_id', p_round_id, 'ai_image_id', r.ai_image_id, 'points', v_points,
    'no_reliable_tell', (select no_reliable_tell from images where id = r.ai_image_id),
    'images', (select jsonb_agg(jsonb_build_object('image_id', i.id, 'origin', i.origin, 'note', i.note, 'clues', to_jsonb(i.clues), 'source', i.source)
                 order by array_position(r.image_ids, i.id)) from images i where i.id = any(r.image_ids)));
end $$;

revoke all on function create_session(text, text[]) from public;
revoke all on function submit_answer(uuid, text, text) from public;
grant execute on function create_session(text, text[]) to anon, authenticated;
grant execute on function submit_answer(uuid, text, text) to anon, authenticated;
