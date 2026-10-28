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
