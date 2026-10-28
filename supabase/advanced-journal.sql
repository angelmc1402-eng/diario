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
