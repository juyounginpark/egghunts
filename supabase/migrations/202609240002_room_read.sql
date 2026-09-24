-- One consistent DB read replaces three sequential REST queries per heartbeat.
create function public.game_read(p_user uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'id',r.id,'revision',r.revision,'state',r.state,
  'members',(select jsonb_agg(jsonb_build_object('user_id',m.user_id,'slot',m.slot,'last_seen',m.last_seen)) from public.game_members m where m.room_id=r.id),
  'profiles',(select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'state',p.state)),'[]'::jsonb)
   from public.game_profiles p join public.game_members m on m.user_id=p.user_id
   where m.room_id=r.id and not (coalesce(r.state->'players','{}'::jsonb) ? p.user_id::text))
 ) from public.game_rooms r join public.game_members self on self.room_id=r.id where self.user_id=p_user
$$;
revoke all on function public.game_read(uuid) from public,anon,authenticated;
grant execute on function public.game_read(uuid) to service_role;
