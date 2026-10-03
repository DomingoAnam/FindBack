alter table public.profiles add column if not exists facebook_url text not null default '';

grant update (full_name, mobile_number, facebook_url, profile_photo_path, updated_at) on public.profiles to authenticated;

create or replace function public.get_report_contact(p_report_id uuid)
returns table(full_name text, mobile_number text, facebook_url text, role text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.reports
    where id = p_report_id
      and ((select public.is_admin()) or user_id = (select auth.uid()) or status <> 'flagged')
  ) then
    raise exception 'Report not found';
  end if;

  return query
  select p.full_name, p.mobile_number, p.facebook_url, p.role
  from public.reports r
  join public.profiles p on p.id = r.user_id
  where r.id = p_report_id;
end;
$$;

grant execute on function public.get_report_contact(uuid) to authenticated;

create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, mobile_number, role)
  select u.id,
         u.email,
         coalesce(u.raw_user_meta_data ->> 'full_name', ''),
         coalesce(u.raw_user_meta_data ->> 'mobile_number', ''),
         'user'
  from auth.users u
  where u.id = (select auth.uid())
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
