-- Weekly rewards use account storage, independently of multiplayer rooms.
-- This counter cannot be overwritten by the ordinary local-save RPC.
create table if not exists public.game_weekly_claims (
 user_id uuid primary key references auth.users(id) on delete cascade,
 claimed bigint not null check(claimed>=0),
 last_day bigint not null
);
alter table public.game_weekly_claims enable row level security;
revoke all on public.game_weekly_claims from public,anon,authenticated;
grant all on public.game_weekly_claims to service_role;

create or replace function public.game_local_claim_weekly(p_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); saved public.game_local_profiles; counter public.game_weekly_claims;
 stamp bigint:=floor(extract(epoch from clock_timestamp())*1000);
 today bigint:=floor((extract(epoch from clock_timestamp())+32400)/86400);
 v_profile jsonb; idx integer; reward numeric; stage integer; egg jsonb; egg_id text;
 deviation double precision; weight integer; already boolean:=false;
begin
 if uid is null then raise exception 'SIGN_IN'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into saved from public.game_local_profiles where user_id=uid for update;
 if saved.user_id is null then raise exception 'SAVE_FIRST'; end if;
 if p_revision is null or saved.revision<>p_revision then
  return jsonb_build_object('conflict',true,'serverTime',stamp,'profile',jsonb_build_object(
   'profile',saved.profile,'revision',saved.revision,'updatedAt',floor(extract(epoch from saved.updated_at)*1000)));
 end if;
 v_profile:=saved.profile;
 -- Preserve previous attendance once; subsequent claims trust only this table.
 insert into public.game_weekly_claims(user_id,claimed,last_day) values(uid,
  greatest(0,least(1000000,coalesce((v_profile#>>'{weekly,claimed}')::bigint,0))),
  least(today,coalesce((v_profile#>>'{weekly,lastDay}')::bigint,-1))) on conflict do nothing;
 select * into counter from public.game_weekly_claims where user_id=uid for update;
 already:=counter.last_day>=today;
 if not already then
  idx:=counter.claimed%7;
  if idx=6 and jsonb_array_length(v_profile->'eggs')>=greatest(1,coalesce((v_profile#>>'{progression,level}')::integer,1))*15 then
   return jsonb_build_object('error','EGG_CAPACITY','serverTime',stamp);
  end if;
  -- Mirrors balance.ts stageReward / weeklyMinutes, data.ts weekly egg,
  -- and weight.ts. Keep these constants aligned when changing balance.
  stage:=greatest(1,least(20,coalesce((v_profile->>'highestStage')::integer,1)));
  reward:=greatest(1,floor(9.375*power(1.55::numeric,stage-1)*60*(array[3,4,5,7,9,12,15])[idx+1]));
  v_profile:=jsonb_set(v_profile,'{dust}',to_jsonb((coalesce((v_profile->>'dust')::numeric,0)+reward)::text));
  if idx=6 then
   egg_id:='weekly-'||(counter.claimed+1)::text||'-'||today::text;
   deviation:=case when random()<0.01 then 0.4+random()*0.1 else random()*0.3 end;
   weight:=greatest(1,round(18000*(1+(case when random()<0.5 then -1 else 1 end)*deviation))::integer);
   egg:=jsonb_build_object('id',egg_id,'type',35,'hp',224,'hpVersion',5,'distance',0,'standardWeightG',18000,'weightG',weight);
   v_profile:=jsonb_set(v_profile,'{eggs}',(v_profile->'eggs')||jsonb_build_array(egg));
   if v_profile->>'selected' is null then v_profile:=jsonb_set(v_profile,'{selected}',to_jsonb(egg_id)); end if;
   if not coalesce(v_profile->'discovered','[]'::jsonb) @> '[35]'::jsonb then
    v_profile:=jsonb_set(v_profile,'{discovered}',coalesce(v_profile->'discovered','[]'::jsonb)||'[35]'::jsonb);
   end if;
  end if;
  update public.game_weekly_claims set claimed=claimed+1,last_day=today where user_id=uid returning * into counter;
 end if;
 v_profile:=jsonb_set(v_profile,'{weekly}',jsonb_build_object('claimed',counter.claimed,'lastDay',counter.last_day));
 update public.game_local_profiles set profile=v_profile,revision=revision+1,updated_at=now() where user_id=uid returning * into saved;
 return jsonb_build_object('serverTime',stamp,'alreadyClaimed',already,'profile',jsonb_build_object(
  'profile',saved.profile,'revision',saved.revision,'updatedAt',floor(extract(epoch from saved.updated_at)*1000)));
end $$;
revoke all on function public.game_local_claim_weekly(bigint) from public,anon;
grant execute on function public.game_local_claim_weekly(bigint) to authenticated;
