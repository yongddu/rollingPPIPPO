-- A logged-in account could create planets in a loop. Nothing stops that
-- yet, and each planet is a free slot for unlimited messages, so it's the
-- cheapest way to fill the free tier's storage. Cap it in the database so
-- the limit holds for direct API calls too.
create or replace function limit_planets_per_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owned integer;
begin
  select count(*) into owned from planets where owner_id = new.owner_id;

  if owned >= 20 then
    raise exception 'planet limit reached'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists planets_owner_quota on planets;

create trigger planets_owner_quota
  before insert on planets
  for each row execute procedure limit_planets_per_owner();
