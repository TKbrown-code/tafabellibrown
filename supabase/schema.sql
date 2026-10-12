-- Portfolio schema for Supabase (run in SQL Editor, or via the Supabase CLI as a migration)
-- Tables: projects (case studies), posts (blog), skills, messages (contact form), admins

create extension if not exists "pgcrypto";

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Projects ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  title_zh text,
  tagline text not null default '',
  tagline_zh text,
  summary text not null default '',
  summary_zh text,
  role text not null default '',
  role_zh text,
  year text not null default '',
  problem text not null default '',
  problem_zh text,
  approach text not null default '',
  approach_zh text,
  results text not null default '',
  results_zh text,
  metrics jsonb not null default '[]'::jsonb,   -- [{ "value": "40%", "label": "...", "label_zh": "..." }]
  tech text[] not null default '{}',
  live_url text,
  repo_url text,
  cover_url text,
  featured boolean not null default true,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Blog posts ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  title_zh text,
  excerpt text not null default '',
  excerpt_zh text,
  content text not null default '',            -- Markdown
  content_zh text,
  tags text[] not null default '{}',
  cover_url text,
  reading_minutes int not null default 4,
  published boolean not null default false,
  published_at timestamptz default now(),
  created_at timestamptz not null default now()
);

-- ---------- Skills ----------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  category text not null,  -- frontend | backend | data | devops | testing
  name text not null,
  sort_order int not null default 0
);

-- ---------- Contact messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  subject text check (char_length(subject) <= 200),
  body text not null check (char_length(body) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.admins   enable row level security;
alter table public.projects enable row level security;
alter table public.posts    enable row level security;
alter table public.skills   enable row level security;
alter table public.messages enable row level security;

-- Public read of published content
create policy "public read projects" on public.projects for select using (published or public.is_admin());
create policy "public read posts"    on public.posts    for select using (published or public.is_admin());
create policy "public read skills"   on public.skills   for select using (true);

-- Admin write access
create policy "admin write projects" on public.projects for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write posts"    on public.posts    for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write skills"   on public.skills   for all using (public.is_admin()) with check (public.is_admin());

-- Anyone can send a message; only admins can read / update / delete
create policy "anyone insert messages" on public.messages for insert with check (true);
create policy "admin read messages"    on public.messages for select using (public.is_admin());
create policy "admin update messages"  on public.messages for update using (public.is_admin());
create policy "admin delete messages"  on public.messages for delete using (public.is_admin());

create policy "admin read admins" on public.admins for select using (auth.uid() = user_id);

-- ---------- Make yourself admin ----------
-- 1) Authentication -> Users -> "Add user" (email + password). Disable public sign-ups.
-- 2) Run:  insert into public.admins (user_id) select id from auth.users where email = 'tafabilly73@gmail.com';
