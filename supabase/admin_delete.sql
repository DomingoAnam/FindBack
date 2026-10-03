create or replace function public.admin_delete_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  report_name text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete reports';
  end if;

  select item_name into report_name from public.reports where id = p_report_id;

  delete from public.reports where id = p_report_id;

  perform public.write_audit('REPORT_REMOVED', 'report', p_report_id::text, coalesce(report_name, ''));
end;
$$;

grant execute on function public.admin_delete_report(uuid) to authenticated;
