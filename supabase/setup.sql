-- Pixie Craft Studio RSVP: run this once in Supabase (SQL Editor > New query > paste > Run).
-- It makes the tables for the website's data and sign-ins, and the "media" folder for uploaded pictures and videos.

create table if not exists public.pixie_rows (
  key text primary key,          -- client:<id>, studio:<name> or meta:<name>
  value text not null,           -- the data, as JSON text
  rev integer not null default 1 -- goes up on every save, so two saves at the same time can't overwrite each other
);
create table if not exists public.pixie_sessions (
  sid_hash text primary key,     -- only a fingerprint of each sign-in, never the sign-in itself
  kind text not null,
  value text not null,
  expires bigint not null
);

-- Nobody but the website's own Edge Function (which uses the secret service key) may read or change these tables.
alter table public.pixie_rows enable row level security;
alter table public.pixie_sessions enable row level security;
revoke all on public.pixie_rows from anon, authenticated;
revoke all on public.pixie_sessions from anon, authenticated;
grant all on public.pixie_rows, public.pixie_sessions to service_role;

-- Saves several rows in one go, or none at all if any of them changed since it was read.
create or replace function public.pixie_commit(changes jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare c jsonb; n integer;
begin
  for c in select * from jsonb_array_elements(changes) loop
    if c->>'op' = 'put' and (c->>'rev')::int = 0 then
      insert into pixie_rows (key, value, rev) values (c->>'key', c->>'value', 1) on conflict (key) do nothing;
    elsif c->>'op' = 'put' then
      update pixie_rows set value = c->>'value', rev = rev + 1 where key = c->>'key' and rev = (c->>'rev')::int;
    else
      delete from pixie_rows where key = c->>'key' and rev = (c->>'rev')::int;
    end if;
    get diagnostics n = row_count;
    if n = 0 then raise exception 'pixie_conflict'; end if;
  end loop;
  return true;
end $$;
revoke all on function public.pixie_commit(jsonb) from public, anon, authenticated;
grant execute on function public.pixie_commit(jsonb) to service_role;

-- Uploaded pictures and videos. Anyone can view them (guests need to), only the Edge Function can add them.
-- 50 MB per file is the most the free Supabase plan allows.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'])
on conflict (id) do nothing;
