begin;

-- Administrative membership is managed on the server, never through a profile.
create table public.diary_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.diary_admins enable row level security;
revoke all on public.diary_admins from public, anon, authenticated;
grant select on public.diary_admins to authenticated;
grant all on public.diary_admins to service_role;
create policy own_admin_membership on public.diary_admins for select to authenticated
using (user_id = (select auth.uid()));

create table public.diary_invitations (
  id uuid primary key,
  invited_by uuid not null references auth.users(id),
  email text not null check (length(email) between 3 and 254),
  delivery text not null check (delivery in ('email','link')),
  status text not null default 'pending' check (status in ('pending','email_sent','link_created','failed')),
  user_id uuid references auth.users(id) on delete set null,
  error_code text,
  created_at timestamptz not null default now()
);
create index diary_invitations_actor_created on public.diary_invitations(invited_by,created_at desc);
create index diary_invitations_email_created on public.diary_invitations(email,created_at desc);
alter table public.diary_invitations enable row level security;
revoke all on public.diary_invitations from public, anon, authenticated;
grant select on public.diary_invitations to authenticated;
grant all on public.diary_invitations to service_role;
create policy admins_read_invitations on public.diary_invitations for select to authenticated
using (exists (select 1 from public.diary_admins a where a.user_id = (select auth.uid())));

-- Server-only atomic reservation prevents duplicate sends and concurrent rate-limit bypass.
create function public.reserve_diary_invitation(p_id uuid,p_actor uuid,p_email text,p_delivery text)
returns uuid language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,0));
  if not exists (select 1 from public.diary_admins where user_id=p_actor) then
    raise exception 'admin_required';
  end if;
  if exists (select 1 from public.diary_invitations where id=p_id) then
    raise exception 'duplicate_request';
  end if;
  if (select count(*) from public.diary_invitations where invited_by=p_actor and created_at>now()-interval '1 hour')>=10
     or (select count(*) from public.diary_invitations where invited_by=p_actor and created_at>now()-interval '1 day')>=50 then
    raise exception 'invite_rate_limit';
  end if;
  if exists (select 1 from public.diary_invitations where email=p_email and created_at>now()-interval '1 minute') then
    raise exception 'invite_email_cooldown';
  end if;
  insert into public.diary_invitations(id,invited_by,email,delivery) values(p_id,p_actor,p_email,p_delivery);
  return p_id;
end;
$$;
revoke all on function public.reserve_diary_invitation(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.reserve_diary_invitation(uuid,uuid,text,text) to service_role;
commit;

-- Bootstrap the owner separately after verifying their existing account.
-- Do not grant administrators access to personal diary tables or Storage.
