-- Room state remains durable on every authoritative tick. Avoid rewriting all
-- profiles merely because lastSavedAt / in-flight coordinates changed.
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
  update public.game_profiles p set state=entry.value->'runtime',updated_at=now()
  where p.user_id=entry.key::uuid and exists
   (select 1 from public.game_members where user_id=entry.key::uuid and room_id=p_room)
  and (p.state is null or p.updated_at < now()-interval '5 seconds'
   or ((p.state->'save')-'lastSavedAt'-'expedition') is distinct from
      ((entry.value->'runtime'->'save')-'lastSavedAt'-'expedition'));
 end loop;
 update public.game_members set last_seen=now() where user_id=p_user
  and last_seen < now()-interval '1 second';
 return true;
end $$;
revoke all on function public.game_commit(uuid,bigint,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.game_commit(uuid,bigint,jsonb,uuid) to service_role;
