-- Visitors write without an account, so anon needs insert. Row shape is
-- already constrained by the CHECKs in 0001 (nickname <= 20, body <= 300,
-- scale within range); this policy additionally stops a writer from
-- pre-hiding a message or smuggling in a photo before that feature exists.
grant insert on public.messages to anon, authenticated;

drop policy if exists "anyone can leave a message" on messages;

create policy "anyone can leave a message"
  on messages for insert
  to anon, authenticated
  with check (is_hidden = false and photo_url is null and photo_meta is null);

-- Burst protection. Enforced in the database rather than the app so it
-- holds even if someone posts straight to the REST API, and so a spam
-- loop can't quietly burn through the free tier's storage.
create or replace function limit_message_rate()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from messages
  where planet_id = new.planet_id
    and created_at > now() - interval '1 minute';

  if recent_count >= 20 then
    raise exception 'too many messages, try again in a moment'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_rate_limit on messages;

create trigger messages_rate_limit
  before insert on messages
  for each row execute procedure limit_message_rate();

-- Let visitors see each other's messages appear without reloading.
-- Re-adding a table already in the publication raises, so guard it.
do $$
begin
  alter publication supabase_realtime add table messages;
exception
  when duplicate_object then null;
end;
$$;
