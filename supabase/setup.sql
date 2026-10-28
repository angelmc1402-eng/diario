begin;
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '', height_cm numeric(5,1) check(height_cm>0),
  age_at_start integer check(age_at_start>0), start_date date not null default current_date,
  timezone text not null default 'Europe/Madrid'
);
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null, meal_type text not null check(meal_type in ('desayuno','comida','merienda','cena')),
  notes text not null default '', photos text[] not null default '{}',
  created_at timestamptz not null default now(), unique(user_id,date,meal_type)
);
create table if not exists public.exercise (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null, activity text not null check(length(trim(activity))>0),
  minutes integer check(minutes>0), notes text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check(length(trim(title))>0), start_date date not null, end_date date not null,
  tracking text not null default 'daily' check(tracking in ('daily','weekly_exercise','manual')),
  weekly_target integer check(weekly_target>0), created_at timestamptz not null default now(),
  check(end_date>=start_date), unique(id,user_id)
);
create table if not exists public.goal_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid not null, date date not null, completed boolean not null default false,
  foreign key(goal_id,user_id) references public.goals(id,user_id) on delete cascade, unique(goal_id,date)
);
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check(length(trim(title))>0), period_start date not null, period_end date not null,
  completed_on date, notes text not null default '', check(period_end>=period_start)
);
create table if not exists public.weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null, weight_kg numeric(6,2) not null check(weight_kg>0),
  notes text not null default '', unique(user_id,date)
);
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  starts_at timestamptz not null, title text not null default 'Revisión', notes text not null default ''
);
do $$
declare t text;
begin
  foreach t in array array['profiles','meals','exercise','goals','goal_checks','milestones','weights','appointments'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon,authenticated',t);
    execute format('grant select,insert,update,delete on table public.%I to authenticated',t);
    execute format('create index if not exists %I on public.%I(user_id)',t||'_owner_idx',t);
    execute format('drop policy if exists diary_select on public.%I',t);
    execute format('create policy diary_select on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
    execute format('drop policy if exists diary_insert on public.%I',t);
    execute format('create policy diary_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
    execute format('drop policy if exists diary_update on public.%I',t);
    execute format('create policy diary_update on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
    execute format('drop policy if exists diary_delete on public.%I',t);
    execute format('create policy diary_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
  end loop;
end; $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('comidas','comidas',false,15728640,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists diary_photos_select on storage.objects;
create policy diary_photos_select on storage.objects for select to authenticated
using(bucket_id='comidas' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists diary_photos_insert on storage.objects;
create policy diary_photos_insert on storage.objects for insert to authenticated
with check(bucket_id='comidas' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists diary_photos_update on storage.objects;
create policy diary_photos_update on storage.objects for update to authenticated
using(bucket_id='comidas' and (storage.foldername(name))[1]=(select auth.uid()::text))
with check(bucket_id='comidas' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists diary_photos_delete on storage.objects;
create policy diary_photos_delete on storage.objects for delete to authenticated
using(bucket_id='comidas' and (storage.foldername(name))[1]=(select auth.uid()::text));
commit;

-- Alternative POST transport for goal edits. Uses the caller's permissions and RLS.
create or replace function public.update_diary_goal(
  p_id uuid,
  p_title text,
  p_start_date date,
  p_end_date date,
  p_tracking text,
  p_weekly_target integer
)
returns setof public.goals
language sql
security invoker
set search_path = ''
as $$
  update public.goals as g
  set title = p_title,
      start_date = p_start_date,
      end_date = p_end_date,
      tracking = p_tracking,
      weekly_target = p_weekly_target
  where g.id = p_id and g.user_id = (select auth.uid())
  returning g.*;
$$;
revoke all on function public.update_diary_goal(uuid,text,date,date,text,integer) from public, anon;
grant execute on function public.update_diary_goal(uuid,text,date,date,text,integer) to authenticated;
