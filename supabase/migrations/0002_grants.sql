-- The project has "Automatically expose new tables" disabled, so tables
-- created in 0001_init.sql have no privileges granted to the API roles.
-- Grant them explicitly here; RLS policies from 0001 still decide which
-- *rows* each role can touch.

grant usage on schema public to anon, authenticated;

-- planets: anyone can read (public planet pages), owners write via RLS
grant select on public.planets to anon, authenticated;
grant insert, update, delete on public.planets to authenticated;

-- messages: anyone can read visible ones; inserts go through the server
-- route with the service_role key, which bypasses grants and RLS
grant select on public.messages to anon, authenticated;
grant update on public.messages to authenticated;

-- profiles: publicly readable, self-updatable
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
