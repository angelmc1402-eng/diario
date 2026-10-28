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
