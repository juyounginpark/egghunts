-- Per-room transaction locks; only matchmaking shares a capacity lock.
create or replace function public.game_read(p_user uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare target_room uuid; removed integer; result jsonb;
begin
 select m.room_id into target_room from public.game_members m where m.user_id=p_user;
 if target_room is null then return null; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_room::text,8241726));
 if not exists(select 1 from public.game_members where user_id=p_user and room_id=target_room) then return null; end if;
 delete from public.game_members m where m.room_id=target_room and m.user_id<>p_user
  and m.last_seen < now()-interval '15 seconds';
 get diagnostics removed = row_count;
 if removed>0 then update public.game_rooms r set revision=revision+1 where r.id=target_room; end if;
 select jsonb_build_object(
  'id',r.id,'revision',r.revision,'state',r.state,
  'members',(select jsonb_agg(jsonb_build_object('user_id',m.user_id,'slot',m.slot,'last_seen',m.last_seen)) from public.game_members m where m.room_id=r.id),
  'profiles',(select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'state',p.state)),'[]'::jsonb)
   from public.game_profiles p join public.game_members m on m.user_id=p.user_id
   where m.room_id=r.id and not (coalesce(r.state->'players','{}'::jsonb) ? p.user_id::text))
 ) into result from public.game_rooms r where r.id=target_room;
 return result;
end $$;

create or replace function public.game_join(p_user uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r uuid; s integer; stale_room uuid; removed integer;
begin
 perform pg_advisory_xact_lock(8241726);
 insert into public.game_profiles(user_id) values(p_user) on conflict do nothing;
 for stale_room in select distinct room_id from public.game_members where last_seen < now()-interval '15 seconds' order by room_id loop
  perform pg_advisory_xact_lock(hashtextextended(stale_room::text,8241726));
  delete from public.game_members where room_id=stale_room and last_seen < now()-interval '15 seconds';
  get diagnostics removed = row_count;
  if removed>0 then update public.game_rooms set revision=revision+1 where id=stale_room; end if;
 end loop;
 select room_id,slot into r,s from public.game_members where user_id=p_user;
 if r is null then
  select room.id into r from public.game_rooms room
  join public.game_members m on m.room_id=room.id
  group by room.id,room.created_at having count(*)<5
  order by count(*) desc,room.created_at limit 1;
  if r is null then insert into public.game_rooms default values returning id into r; end if;
  perform pg_advisory_xact_lock(hashtextextended(r::text,8241726));
  select n into s from generate_series(0,4) n where not exists
   (select 1 from public.game_members m where m.room_id=r and m.slot=n) order by n limit 1;
  insert into public.game_members(user_id,room_id,slot) values(p_user,r,s);
  update public.game_rooms set revision=revision+1 where id=r;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(r::text,8241726));
 update public.game_members set last_seen=now() where user_id=p_user;
 return jsonb_build_object('room',r,'slot',s);
end $$;

create or replace function public.game_commit(p_room uuid,p_revision bigint,p_state jsonb,p_user uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_revision bigint; entry record;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_room::text,8241726));
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
create or replace function public.game_leave(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r uuid;
begin
 select room_id into r from public.game_members where user_id=p_user;
 if r is null then return; end if;
 perform pg_advisory_xact_lock(hashtextextended(r::text,8241726));
 delete from public.game_members where user_id=p_user and room_id=r;
 if found then update public.game_rooms set revision=revision+1 where id=r; end if;
end $$;

revoke all on function public.game_read(uuid),public.game_join(uuid),public.game_commit(uuid,bigint,jsonb,uuid),public.game_leave(uuid) from public,anon,authenticated;
grant execute on function public.game_read(uuid),public.game_join(uuid),public.game_commit(uuid,bigint,jsonb,uuid),public.game_leave(uuid) to service_role;
