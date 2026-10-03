create extension if not exists pg_trgm with schema public;

create or replace function public.flag_possible_matches()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  score double precision;
begin
  if new.status <> 'reported' then
    return new;
  end if;

  for candidate in
    select id, user_id, item_name, category, location, color, brand
    from public.reports
    where id <> new.id
      and report_type <> new.report_type
      and status in ('reported', 'possible_match')
  loop
    score :=
      0.35 * public.similarity(lower(new.item_name), lower(candidate.item_name))
      + 0.20 * public.similarity(lower(new.category), lower(candidate.category))
      + 0.20 * public.similarity(lower(new.location), lower(candidate.location))
      + 0.15 * public.similarity(lower(new.color), lower(candidate.color))
      + 0.10 * public.similarity(lower(new.brand), lower(candidate.brand));

    if score >= 0.30 then
      insert into public.matches (lost_report_id, found_report_id, match_score)
      values (
        case when new.report_type = 'lost' then new.id else candidate.id end,
        case when new.report_type = 'lost' then candidate.id else new.id end,
        round(score::numeric, 3)
      )
      on conflict (lost_report_id, found_report_id) do nothing;

      update public.reports set status = 'possible_match', updated_at = now()
      where id in (new.id, candidate.id) and status = 'reported';

      perform public.notify_user(candidate.user_id, candidate.id, 'match',
        'Possible match found',
        format('A %s report for "%s" may match your report. Review it in Updates.', new.report_type, new.item_name));
      perform public.notify_user(new.user_id, new.id, 'match',
        'Possible match found',
        format('Your report "%s" may match an existing %s report. Review it in Updates.', new.item_name, case when new.report_type = 'lost' then 'found' else 'lost' end));

      update public.reports set status = 'possible_match', updated_at = now()
      where id = new.id and status = 'reported';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists reports_flag_matches on public.reports;
create trigger reports_flag_matches
  after insert on public.reports
  for each row execute procedure public.flag_possible_matches();
