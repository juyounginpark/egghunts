-- Defaults to Edge. Cutover is an explicit service-role update after EC2 is ready.
create table public.game_backend (
 id boolean primary key default true check(id),
 mode text not null default 'edge' check(mode in ('edge','ec2')),
 owner uuid,
 check(mode='edge' or owner is not null)
);
insert into public.game_backend(id) values(true);
create table public.game_ec2_versions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 owner uuid not null,
 revision bigint not null
);
alter table public.game_backend enable row level security;
alter table public.game_ec2_versions enable row level security;
revoke all on public.game_backend,public.game_ec2_versions from public,anon,authenticated;
grant all on public.game_backend,public.game_ec2_versions to service_role;

-- Prevent an old Edge client from overwriting a profile owned by the EC2 host.
-- The row lock also makes cutover wait for in-flight Edge profile commits.
create function public.game_profile_backend_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare backend public.game_backend;
begin
 select * into backend from public.game_backend where id=true for share;
 if backend.mode='ec2' and coalesce(current_setting('game.ec2_owner',true),'')<>backend.owner::text then
  raise exception 'SERVER_MOVED';
 end if;
 return new;
end $$;
create trigger game_profile_backend_guard before insert or update on public.game_profiles
for each row execute function public.game_profile_backend_guard();
create trigger game_room_backend_guard before insert or update on public.game_rooms
for each row execute function public.game_profile_backend_guard();

-- Monotonic checkpoints make retries harmless. Never callable with a player JWT.
create function public.game_ec2_checkpoint(p_owner uuid,p_profiles jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare backend public.game_backend; entry jsonb; accepted uuid;
begin
 select * into backend from public.game_backend where id=true for share;
 if backend.mode<>'ec2' or backend.owner<>p_owner then raise exception 'SERVER_NOT_ACTIVE'; end if;
 if jsonb_typeof(p_profiles)<>'array' or jsonb_array_length(p_profiles)>100 then raise exception 'INVALID_CHECKPOINT'; end if;
 perform set_config('game.ec2_owner',p_owner::text,true);
 for entry in select value from jsonb_array_elements(p_profiles) loop
  accepted:=null;
  insert into public.game_ec2_versions(user_id,owner,revision)
  values((entry->>'user_id')::uuid,p_owner,(entry->>'revision')::bigint)
  on conflict(user_id) do update set owner=excluded.owner,revision=excluded.revision
  where game_ec2_versions.owner<>excluded.owner or game_ec2_versions.revision<excluded.revision
  returning user_id into accepted;
  if accepted is not null then
   insert into public.game_profiles(user_id,state,updated_at) values(accepted,entry->'state',now())
   on conflict(user_id) do update set state=excluded.state,updated_at=excluded.updated_at;
  end if;
 end loop;
end $$;
revoke all on function public.game_ec2_checkpoint(uuid,jsonb),public.game_profile_backend_guard() from public,anon,authenticated;
grant execute on function public.game_ec2_checkpoint(uuid,jsonb) to service_role;
