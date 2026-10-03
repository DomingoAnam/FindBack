drop function if exists public.admin_create_invitation(text, text);

create or replace function public.admin_create_invitation()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can invite administrators';
  end if;

  raw_token := encode(gen_random_bytes(24), 'hex');

  insert into public.admin_invitations (email, full_name, token_hash, invited_by)
  values ('', '', encode(digest(raw_token, 'sha256'), 'hex'), (select auth.uid()));

  perform public.write_audit('ADMIN_INVITED', 'invitation', '', 'Invitation code generated');

  return raw_token;
end;
$$;

grant execute on function public.admin_create_invitation() to authenticated;
