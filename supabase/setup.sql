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

-- One private, optional set of body measurements per user and fortnight.
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_start date not null,
  date date not null,
  waist_cm numeric(6,1) check (waist_cm > 0 and waist_cm <= 500),
  hips_cm numeric(6,1) check (hips_cm > 0 and hips_cm <= 500),
  chest_cm numeric(6,1) check (chest_cm > 0 and chest_cm <= 500),
  arm_cm numeric(6,1) check (arm_cm > 0 and arm_cm <= 500),
  thigh_cm numeric(6,1) check (thigh_cm > 0 and thigh_cm <= 500),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, period_start),
  check (date >= period_start and date <= period_start + 13),
  check (num_nonnulls(waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm) > 0)
);
alter table public.measurements enable row level security;
revoke all on table public.measurements from anon, authenticated;
grant select, insert, update, delete on table public.measurements to authenticated;
drop policy if exists diary_select on public.measurements;
create policy diary_select on public.measurements for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists diary_insert on public.measurements;
create policy diary_insert on public.measurements for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists diary_update on public.measurements;
create policy diary_update on public.measurements for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists diary_delete on public.measurements;
create policy diary_delete on public.measurements for delete to authenticated
using ((select auth.uid()) = user_id);


-- Advanced journal, weekly mode and reports
-- Additive upgrade. Existing entries retain their dates, ownership and values.
alter table public.profiles add column if not exists tracking_mode text not null default 'fortnight' check (tracking_mode in ('fortnight','week'));
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.meals add column if not exists amount_g numeric(10,2) check (amount_g>=0);
alter table public.meals add column if not exists kcal numeric(10,2) check (kcal>=0);
alter table public.meals add column if not exists protein_g numeric(10,2) check (protein_g>=0);
alter table public.meals add column if not exists carbs_g numeric(10,2) check (carbs_g>=0);
alter table public.meals add column if not exists fat_g numeric(10,2) check (fat_g>=0);
alter table public.meals add column if not exists fiber_g numeric(10,2) check (fiber_g>=0);
alter table public.meals add column if not exists salt_g numeric(10,3) check (salt_g>=0);
alter table public.meals add column if not exists nutrition_source text not null default 'manual' check(nutrition_source in ('manual','label','app','estimate'));
alter table public.exercise add column if not exists workout_type text check(workout_type in ('walking','cardio','strength','mobility','sport','mixed','other'));
alter table public.exercise add column if not exists muscle_groups text[] not null default '{}' check(muscle_groups <@ array['legs','back','chest','shoulders','arms','core','full_body']::text[]);
alter table public.exercise add column if not exists kcal_burned numeric(10,2) check(kcal_burned>=0);
alter table public.exercise add column if not exists distance_km numeric(10,2) check(distance_km>=0);
alter table public.exercise add column if not exists steps integer check(steps>=0);
alter table public.exercise add column if not exists sets integer check(sets>0);
alter table public.exercise add column if not exists reps integer check(reps>0);
alter table public.exercise add column if not exists load_kg numeric(10,2) check(load_kg>=0);
alter table public.exercise add column if not exists exertion integer check(exertion between 1 and 10);
alter table public.exercise add column if not exists calorie_source text not null default 'manual' check(calorie_source in ('manual','watch','app','estimate'));
alter table public.goals add column if not exists template text not null default 'custom' check(template in ('walk','exercise','water','read','custom'));
alter table public.goals add column if not exists target_value numeric(10,2) check(target_value>0);
alter table public.goals add column if not exists target_unit text not null default 'veces' check(length(target_unit) between 1 and 30);
alter table public.goals add column if not exists frequency text not null default 'daily' check(frequency in ('daily','weekly','period'));
alter table public.goals add column if not exists notes text not null default '';
alter table public.goal_checks add column if not exists value numeric(10,2) check(value>=0);
create table if not exists public.day_status (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 date date not null,
 nutrition_complete boolean not null default false,
 exercise_complete boolean not null default false,
 unique(user_id,date)
);
alter table public.day_status enable row level security;
revoke all on public.day_status from anon,authenticated;
grant select,insert,update,delete on public.day_status to authenticated;
drop policy if exists diary_select on public.day_status;
create policy diary_select on public.day_status for select to authenticated using((select auth.uid())=user_id);
drop policy if exists diary_insert on public.day_status;
create policy diary_insert on public.day_status for insert to authenticated with check((select auth.uid())=user_id);
drop policy if exists diary_update on public.day_status;
create policy diary_update on public.day_status for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists diary_delete on public.day_status;
create policy diary_delete on public.day_status for delete to authenticated using((select auth.uid())=user_id);
-- Measurements retain their original 14-day periods; new 7-day sets can coexist.
alter table public.measurements add column if not exists period_days integer not null default 14 check(period_days in (7,14));
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.measurements'::regclass and contype='c' and pg_get_constraintdef(oid) like '%date%' and pg_get_constraintdef(oid) like '%period_start%' loop
 execute format('alter table public.measurements drop constraint %I',c.conname);
 end loop;
 for c in select conname from pg_constraint where conrelid='public.measurements'::regclass and contype='u' and pg_get_constraintdef(oid)='UNIQUE (user_id, period_start)' loop
 execute format('alter table public.measurements drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.measurements add constraint measurements_date_in_period check(date>=period_start and date<period_start+period_days);
alter table public.measurements drop constraint if exists measurements_user_period_mode_key;
alter table public.measurements add constraint measurements_user_period_mode_key unique(user_id,period_start,period_days);
-- JSON input is mapped to a fixed column list. RLS and auth.uid() enforce ownership.
create or replace function public.update_diary_goal_v2(p_id uuid,p_goal jsonb)
returns setof public.goals language sql security invoker set search_path='' as $$
 update public.goals g set
 title=p_goal->>'title', start_date=(p_goal->>'start_date')::date,
 end_date=(p_goal->>'end_date')::date, tracking=p_goal->>'tracking',
 weekly_target=(p_goal->>'weekly_target')::integer,
 template=p_goal->>'template', target_value=(p_goal->>'target_value')::numeric,
 target_unit=p_goal->>'target_unit', frequency=p_goal->>'frequency', notes=coalesce(p_goal->>'notes','')
 where g.id=p_id and g.user_id=(select auth.uid()) returning g.*;
$$;
revoke all on function public.update_diary_goal_v2(uuid,jsonb) from public,anon;
grant execute on function public.update_diary_goal_v2(uuid,jsonb) to authenticated;


-- Body photos, meal time, lunch and completion options
alter table public.meals add column if not exists meal_time time;
alter table public.meals drop constraint if exists meals_meal_type_check;
alter table public.meals add constraint meals_meal_type_check check(meal_type in ('desayuno','almuerzo','comida','merienda','cena'));
alter table public.goals add column if not exists completion_mode text check(completion_mode in ('minimum','once'));
create table if not exists public.body_photos(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 date date not null,front_photo text,side_photo text,back_photo text,notes text not null default '',created_at timestamptz not null default now(),
 unique(user_id,date),check(coalesce(front_photo,side_photo,back_photo) is not null)
);
alter table public.body_photos enable row level security;
revoke all on public.body_photos from anon,authenticated;
grant select,insert,update,delete on public.body_photos to authenticated;
create policy body_owner_select on public.body_photos for select to authenticated using((select auth.uid())=user_id);
create policy body_owner_insert on public.body_photos for insert to authenticated with check((select auth.uid())=user_id);
create policy body_owner_update on public.body_photos for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy body_owner_delete on public.body_photos for delete to authenticated using((select auth.uid())=user_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('cuerpo','cuerpo',false,5242880,array['image/jpeg']) on conflict(id) do nothing;
create policy body_storage_select on storage.objects for select to authenticated using(bucket_id='cuerpo' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy body_storage_insert on storage.objects for insert to authenticated with check(bucket_id='cuerpo' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy body_storage_update on storage.objects for update to authenticated using(bucket_id='cuerpo' and (storage.foldername(name))[1]=(select auth.uid()::text)) with check(bucket_id='cuerpo' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy body_storage_delete on storage.objects for delete to authenticated using(bucket_id='cuerpo' and (storage.foldername(name))[1]=(select auth.uid()::text));

create or replace function public.update_diary_goal_v2(p_id uuid,p_goal jsonb)
returns setof public.goals language sql security invoker set search_path='' as $$
 update public.goals g set
 title=p_goal->>'title', start_date=(p_goal->>'start_date')::date,
 end_date=(p_goal->>'end_date')::date, tracking=p_goal->>'tracking',
 weekly_target=(p_goal->>'weekly_target')::integer,
 template=p_goal->>'template', target_value=(p_goal->>'target_value')::numeric,
 target_unit=p_goal->>'target_unit', frequency=p_goal->>'frequency', notes=coalesce(p_goal->>'notes',''), completion_mode=p_goal->>'completion_mode'
 where g.id=p_id and g.user_id=(select auth.uid()) returning g.*;
$$;
revoke all on function public.update_diary_goal_v2(uuid,jsonb) from public,anon;
grant execute on function public.update_diary_goal_v2(uuid,jsonb) to authenticated;
