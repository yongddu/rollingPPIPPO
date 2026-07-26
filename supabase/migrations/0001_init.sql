-- profiles: mirrors auth.users, populated automatically on signup
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are publicly readable"
  on profiles for select
  using (true);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- auto-create a profile row whenever a new auth user signs up
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- planets: one per owner-created page
create table planets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  deadline timestamptz,
  allow_photos boolean not null default false,
  theme jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table planets enable row level security;

create policy "planets are publicly readable"
  on planets for select
  using (true);

create policy "owners can insert their own planet"
  on planets for insert
  with check (auth.uid() = owner_id);

create policy "owners can update their own planet"
  on planets for update
  using (auth.uid() = owner_id);

create policy "owners can delete their own planet"
  on planets for delete
  using (auth.uid() = owner_id);

-- messages: anonymous, no account required to write
create table messages (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid not null references planets(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  body text not null check (char_length(body) between 1 and 300),
  pos_x double precision not null,
  pos_y double precision not null,
  pos_z double precision not null,
  scale real not null default 1.0 check (scale between 0.3 and 3.0),
  photo_url text,
  photo_meta jsonb,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_planet_id_idx on messages (planet_id);

alter table messages enable row level security;

create policy "visible messages are publicly readable"
  on messages for select
  using (is_hidden = false);

create policy "planet owners can read all their messages"
  on messages for select
  using (
    exists (
      select 1 from planets
      where planets.id = messages.planet_id
      and planets.owner_id = auth.uid()
    )
  );

-- note: no public insert policy on messages — writes go through the
-- app/api/messages server route using the service_role key, so length
-- limits and future spam/rate-limit checks live in one place (see
-- app/api/messages/route.ts, added in Phase 3).

create policy "planet owners can hide their own messages"
  on messages for update
  using (
    exists (
      select 1 from planets
      where planets.id = messages.planet_id
      and planets.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from planets
      where planets.id = messages.planet_id
      and planets.owner_id = auth.uid()
    )
  );
