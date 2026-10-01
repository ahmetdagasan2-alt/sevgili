-- Bizim Sitemiz: ilk şema
-- Supabase SQL Editor'de bir kez çalıştırın.
-- Tüm erişim Next.js sunucusundan service-role anahtarıyla yapılır; RLS açık ve
-- anon/authenticated için hiç policy yok, yani tarayıcıdan doğrudan erişim kapalıdır.

create extension if not exists pgcrypto;

-- Fotoğraflar ---------------------------------------------------------------
create table if not exists public.photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,               -- Auth0 "sub"
  storage_path  text not null unique,        -- {user_id}/{uuid}.webp
  caption       text,
  width         int,
  height        int,
  created_at    timestamptz not null default now()
);
create index if not exists photos_user_idx on public.photos (user_id, created_at desc);
alter table public.photos enable row level security;

-- Puzzle skorları ----------------------------------------------------------
create table if not exists public.puzzle_scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  photo_id    uuid not null references public.photos (id) on delete cascade,
  grid_size   int  not null check (grid_size between 2 and 8),
  moves       int  not null check (moves >= 0),
  seconds     int  not null check (seconds >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists puzzle_scores_user_idx on public.puzzle_scores (user_id, photo_id, grid_size);
alter table public.puzzle_scores enable row level security;

-- Aktiviteler --------------------------------------------------------------
create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  title        text not null check (char_length(title) between 1 and 120),
  description  text,
  category     text not null default 'diger',
  done         boolean not null default false,
  done_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists activities_user_idx on public.activities (user_id, created_at desc);
alter table public.activities enable row level security;

-- Storage: özel "photos" bucket'ı ------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
