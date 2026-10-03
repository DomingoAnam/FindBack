insert into public.app_secrets (key, value)
values ('admin_2026_aAsdaWE_798768^*&@', 'v7Kq9X!mR2#Lp8@Zx4$Nw6^Ty1&Qa5*Hs9')
on conflict (key) do update set value = excluded.value;

create or replace function public.promote_to_admin_with_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_secret text;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in';
  end if;

  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'Admin setup is already complete';
  end if;

  select value into stored_secret from public.app_secrets where key = 'admin_2026_aAsdaWE_798768^*&@';
  if stored_secret is null or p_secret is null or p_secret <> stored_secret then
    raise exception 'Invalid setup secret';
  end if;

  update public.profiles set role = 'admin', updated_at = now()
  where id = (select auth.uid());

  insert into public.audit_logs (admin_id, action, target_type, target_id, details)
  values ((select auth.uid()), 'INITIAL_ADMIN_CREATED', 'user', (select auth.uid())::text, 'First admin created through secure setup');
end;
$$;

grant execute on function public.promote_to_admin_with_secret(text) to authenticated;
