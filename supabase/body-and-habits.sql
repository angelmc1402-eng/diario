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
