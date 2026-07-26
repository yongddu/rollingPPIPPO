-- Planet owners can remove messages left on their own planet.
grant delete on public.messages to authenticated;

drop policy if exists "planet owners can delete messages" on messages;

create policy "planet owners can delete messages"
  on messages for delete
  to authenticated
  using (
    exists (
      select 1 from planets
      where planets.id = messages.planet_id
      and planets.owner_id = auth.uid()
    )
  );
