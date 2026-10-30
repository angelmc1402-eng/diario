begin;
alter table public.profiles add column dashboard_layout jsonb;
alter table public.profiles add constraint profiles_dashboard_layout_valid check (
 dashboard_layout is null or (
  jsonb_typeof(dashboard_layout)='object' and dashboard_layout @> '{"version":1}'::jsonb
  and octet_length(dashboard_layout::text)<=12000
 )
);
-- Update only preferences. Reuse the caller's existing profile permissions and RLS.
create function public.update_diary_dashboard(p_layout jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
 if p_layout is null then raise exception 'layout_required'; end if;
 update public.profiles set dashboard_layout=p_layout where user_id=(select auth.uid())
 returning dashboard_layout into result;
 if not found then raise exception 'profile_not_found'; end if;
 return result;
end;
$$;
revoke all on function public.update_diary_dashboard(jsonb) from public,anon;
grant execute on function public.update_diary_dashboard(jsonb) to authenticated;
comment on column public.profiles.dashboard_layout is 'Versioned private homepage layout. NULL keeps the original Diario layout.';
commit;
