-- No client is allowed to write rooms, inventories or balances directly.
create table public.game_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb,
 updated_at timestamptz not null default now()
);
create table public.game_rooms (
 id uuid primary key default gen_random_uuid(),
 revision bigint not null default 0,
 state jsonb,
 created_at timestamptz not null default now()
);
create table public.game_members (
 user_id uuid primary key references public.game_profiles(user_id) on delete cascade,
 room_id uuid not null references public.game_rooms(id) on delete cascade,
 slot integer not null check (slot between 0 and 4),
 last_seen timestamptz not null default now(),
 unique(room_id,slot)
);
create index game_members_room on public.game_members(room_id);
alter table public.game_profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.game_members enable row level security;
revoke all on public.game_profiles,public.game_rooms,public.game_members from public,anon,authenticated;
grant all on public.game_profiles,public.game_rooms,public.game_members to service_role;

-- The advisory lock covers capacity and smallest free slot as one transaction.
create function public.game_join(p_user uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r uuid; s integer;
begin
 perform pg_advisory_xact_lock(8241726);
 insert into public.game_profiles(user_id) values(p_user) on conflict do nothing;
 update public.game_rooms set revision=revision+1 where id in
  (select room_id from public.game_members where last_seen < now()-interval '60 seconds');
 delete from public.game_members where last_seen < now()-interval '60 seconds';
 select room_id,slot into r,s from public.game_members where user_id=p_user;
 if r is null then
  select room.id into r from public.game_rooms room
  join public.game_members m on m.room_id=room.id
  group by room.id,room.created_at having count(*)<5
  order by count(*) desc,room.created_at limit 1;
  if r is null then insert into public.game_rooms default values returning id into r; end if;
  select n into s from generate_series(0,4) n where not exists
   (select 1 from public.game_members m where m.room_id=r and m.slot=n) order by n limit 1;
  insert into public.game_members(user_id,room_id,slot) values(p_user,r,s);
  -- Invalidate any room calculation made before membership changed.
  update public.game_rooms set revision=revision+1 where id=r;
 end if;
 update public.game_members set last_seen=now() where user_id=p_user;
 return jsonb_build_object('room',r,'slot',s);
end $$;

-- Commit the shared world AND every affected personal inventory atomically.
-- A competing claim must reload and revalidate after a revision conflict.
create function public.game_commit(p_room uuid,p_revision bigint,p_state jsonb,p_user uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_revision bigint; entry record;
begin
 perform pg_advisory_xact_lock(8241726);
 select revision into current_revision from public.game_rooms where id=p_room for update;
 if current_revision is null or current_revision<>p_revision then return false; end if;
 if not exists(select 1 from public.game_members where user_id=p_user and room_id=p_room)
 then return false; end if;
 update public.game_rooms set state=p_state,revision=revision+1 where id=p_room;
 for entry in select key,value from jsonb_each(p_state->'players') loop
  update public.game_profiles set state=entry.value->'runtime',updated_at=now()
  where user_id=entry.key::uuid and exists
   (select 1 from public.game_members where user_id=entry.key::uuid and room_id=p_room);
 end loop;
 update public.game_members set last_seen=now() where user_id=p_user;
 return true;
end $$;
create function public.game_leave(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r uuid;
begin
 perform pg_advisory_xact_lock(8241726);
 delete from public.game_members where user_id=p_user returning room_id into r;
 if r is not null then update public.game_rooms set revision=revision+1 where id=r; end if;
end $$;
revoke all on function public.game_join(uuid),public.game_commit(uuid,bigint,jsonb,uuid),public.game_leave(uuid) from public,anon,authenticated;
grant execute on function public.game_join(uuid),public.game_commit(uuid,bigint,jsonb,uuid),public.game_leave(uuid) to service_role;
