-- Separate table: legacy EC2/Edge writers cannot overwrite a local-first profile.
create table public.game_local_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 profile jsonb not null,
 revision bigint not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.game_local_profiles enable row level security;
revoke all on public.game_local_profiles from public,anon,authenticated;
grant all on public.game_local_profiles to service_role;

create function public.game_local_time() returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object('serverTime',floor(extract(epoch from clock_timestamp())*1000));
$$;

create function public.game_local_load() returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); row public.game_local_profiles;
begin
 if uid is null then raise exception 'SIGN_IN'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 -- Keep every legacy field for the client's versioned migration. Never delete old data.
 insert into public.game_local_profiles(user_id,profile)
 select uid,state from public.game_profiles where user_id=uid
 on conflict(user_id) do nothing;
 select * into row from public.game_local_profiles where user_id=uid;
 return jsonb_build_object('serverTime',floor(extract(epoch from clock_timestamp())*1000),
  'profile',case when row.user_id is null then null else jsonb_build_object('profile',row.profile,'revision',row.revision,'updatedAt',floor(extract(epoch from row.updated_at)*1000)) end);
end $$;

create function public.game_local_save(p_profile jsonb,p_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); row public.game_local_profiles;
begin
 if uid is null then raise exception 'SIGN_IN'; end if;
 if p_profile is null or p_revision is null or jsonb_typeof(p_profile)<>'object' or octet_length(p_profile::text)>2097152 or p_revision<0
  or coalesce(p_profile->>'version','')<>'1' or coalesce(jsonb_typeof(p_profile->'mongles'),'')<>'array'
  or coalesce(jsonb_typeof(p_profile->'eggs'),'')<>'array' then raise exception 'INVALID_PROFILE'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into row from public.game_local_profiles where user_id=uid for update;
 if (row.user_id is not null and row.revision<>p_revision) or (row.user_id is null and p_revision<>0) then
  return jsonb_build_object('conflict',true,'serverTime',floor(extract(epoch from clock_timestamp())*1000),
   'profile',case when row.user_id is null then null else jsonb_build_object('profile',row.profile,'revision',row.revision,'updatedAt',floor(extract(epoch from row.updated_at)*1000)) end);
 end if;
 insert into public.game_local_profiles(user_id,profile,revision) values(uid,p_profile,p_revision+1)
 on conflict(user_id) do update set profile=excluded.profile,revision=excluded.revision,updated_at=now();
 return jsonb_build_object('conflict',false,'revision',p_revision+1,'serverTime',floor(extract(epoch from clock_timestamp())*1000));
end $$;
revoke all on function public.game_local_time(),public.game_local_load(),public.game_local_save(jsonb,bigint) from public,anon;
grant execute on function public.game_local_time(),public.game_local_load(),public.game_local_save(jsonb,bigint) to authenticated;
