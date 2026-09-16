-- Supabase Database Schema for ToiNayLoGi

-- 1. Profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  total_spins integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. User Inventory table (Actresses & Movies)
create table if not exists public.user_inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  item_type text check (item_type in ('actress', 'movie')) not null,
  item_id text not null,
  item_name text not null,
  item_subname text,
  tier integer check (tier >= 0 and tier <= 4) not null,
  image_url text not null,
  metadata jsonb default '{}'::jsonb,
  quantity integer default 1 not null,
  first_obtained_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_obtained_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_item unique (user_id, item_type, item_id)
);

-- 3. Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_inventory enable row level security;

drop policy if exists "Users can view and update own profile" on public.profiles;
create policy "Users can view and update own profile" on public.profiles
  for all using (auth.uid() = id);

drop policy if exists "Users can manage own inventory" on public.user_inventory;
create policy "Users can manage own inventory" on public.user_inventory
  for all using (auth.uid() = user_id);
