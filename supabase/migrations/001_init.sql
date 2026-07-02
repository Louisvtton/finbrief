-- Users are managed by Supabase Auth

create table profiles (
  id uuid references auth.users primary key,
  name text,
  email text,
  frequency text default 'daily',   -- 'daily' | '2x' | 'weekly'
  digest_time text default 'pre',    -- 'pre' | 'eod' | 'both'
  created_at timestamptz default now()
);

create table watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  ticker text not null,
  name text not null,
  asset_type text not null,  -- 'stock' | 'etf' | 'crypto' | 'commodity' | 'forex'
  created_at timestamptz default now()
);

create table followed_industries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  label text not null,       -- e.g. 'Tech', 'Shoe industry'
  is_custom boolean default false,
  created_at timestamptz default now()
);

create table digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  digest_type text not null,  -- 'pre' | 'eod'
  content jsonb not null,     -- full digest JSON
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  digest_id uuid references digests(id),
  stars int,                  -- 1-5
  tags text[],                -- e.g. ['Tesla', 'Macro news']
  freetext text,
  created_at timestamptz default now()
);

-- Row-level security: users can only see their own data
alter table profiles enable row level security;
alter table watchlist_items enable row level security;
alter table followed_industries enable row level security;
alter table digests enable row level security;
alter table feedback enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own watchlist" on watchlist_items for all using (auth.uid() = user_id);
create policy "own industries" on followed_industries for all using (auth.uid() = user_id);
create policy "own digests" on digests for all using (auth.uid() = user_id);
create policy "own feedback" on feedback for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
