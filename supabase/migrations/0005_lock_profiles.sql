-- Profiles were world-readable, which handed out every owner's display
-- name and Google avatar URL to anyone with the anon key. Nothing in the
-- app renders profiles, so restrict them to the owner.
revoke select on public.profiles from anon;

drop policy if exists "profiles are publicly readable" on profiles;

create policy "users can read their own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);
