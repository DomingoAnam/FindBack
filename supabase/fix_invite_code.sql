create or replace function public.admin_create_invitation()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  seed text;
  code text := '';
  i int;
begin
  if not public.is_admin() then
    raise exception 'Only admins can invite administrators';
  end if;

  seed := md5(random()::text || clock_timestamp()::text || (select auth.uid())::text);
  for i in 1..8 loop
    code := code || substr(chars, (('x' || substr(seed, i, 1))::bit(8)::int % 32) + 1, 1);
  end loop;

  raw_token := 'FB-' || substr(code, 1, 4) || '-' || substr(code, 5, 4);

  insert into public.admin_invitations (email, full_name, token_hash, invited_by)
  values ('', '', md5(raw_token), (select auth.uid()));

  perform public.write_audit('ADMIN_INVITED', 'invitation', '', 'Invitation code generated');

  return raw_token;
end;
$$;

create or replace function public.accept_admin_invitation(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation record;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in';
  end if;

  select * into invitation
  from public.admin_invitations
  where token_hash = md5(p_token)
    and used_at is null
    and revoked_at is null
    and expires_at > now();

  if invitation.id is null then
    raise exception 'Invitation is invalid, expired, or already used';
  end if;

  update public.admin_invitations set used_at = now() where id = invitation.id;
  update public.profiles set role = 'admin', updated_at = now() where id = (select auth.uid());

  insert into public.audit_logs (admin_id, action, target_type, target_id, details)
  values ((select auth.uid()), 'ADMIN_INVITATION_ACCEPTED', 'user', (select auth.uid())::text, 'Invitation accepted');
end;
$$;
