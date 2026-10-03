create or replace function public.owner_update_report_status(p_report_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('recovered', 'closed') then
    raise exception 'Owners can only mark reports as claimed or closed';
  end if;

  update public.reports
  set status = p_status,
      recovered_at = case when p_status = 'recovered' then coalesce(recovered_at, now()) else recovered_at end,
      updated_at = now()
  where id = p_report_id
    and user_id = (select auth.uid())
    and status not in ('recovered', 'closed');

  if not found then
    raise exception 'Report not found or already finalized';
  end if;
end;
$$;

grant execute on function public.owner_update_report_status(uuid, text) to authenticated;
