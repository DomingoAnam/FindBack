-- FindBack test reset: wipes ALL accounts and app data.
-- Preserves: system_settings (contact info) and the admin setup secret below.

truncate table
  public.notifications,
  public.matches,
  public.claims,
  public.report_photos,
  public.reports,
  public.admin_invitations,
  public.audit_logs
cascade;

-- Removes ALL auth accounts (profiles are deleted via cascade).
delete from auth.users;

-- Restart report codes from FB-<year>-000001
alter sequence public.report_code_seq restart with 1;

-- Keep/restore the admin setup secret.
insert into public.app_secrets (key, value)
values ('admin_2026_aAsdaWE_798768^*&@', 'v7Kq9X!mR2#Lp8@Zx4$Nw6^Ty1&Qa5*Hs9')
on conflict (key) do update set value = excluded.value;

-- Storage files cannot be deleted via SQL. Empty them in the dashboard if
-- you want a full wipe: Storage -> item-photos -> select all -> Delete.
