create or replace function public.notify_new_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reporter_name text;
begin
  select nullif(full_name, '') into reporter_name
  from public.profiles where id = new.user_id;

  insert into public.notifications (user_id, report_id, type, title, message)
  select p.id,
         new.id,
         'status',
         case when new.report_type = 'lost' then 'New lost item reported' else 'New found item reported' end,
         format('%s reported a %s item: "%s" at %s.', coalesce(reporter_name, 'Someone'), new.report_type, new.item_name, new.location)
  from public.profiles p
  where p.id <> new.user_id and p.status = 'active';
  return new;
end;
$$;

drop trigger if exists reports_notify_new on public.reports;
create trigger reports_notify_new
  after insert on public.reports
  for each row execute procedure public.notify_new_report();
