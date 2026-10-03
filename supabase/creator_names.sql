drop view if exists public.report_creator_names;

create or replace function public.get_report_creator_names(p_report_ids uuid[])
returns table(report_id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select r.id, p.full_name
  from public.reports r
  join public.profiles p on p.id = r.user_id
  where r.id = any(p_report_ids);
end;
$$;

grant execute on function public.get_report_creator_names(uuid[]) to authenticated;
