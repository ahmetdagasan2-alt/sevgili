-- Bizim Sitemiz: arkadaşlık sistemi
-- 0001_init.sql'den sonra Supabase SQL Editor'de bir kez çalıştırın.
-- Erişim yine sadece Next.js sunucusundan (service-role); RLS açık, policy yok.

-- Profiller -----------------------------------------------------------------
create table if not exists public.profiles (
  user_id       text primary key,            -- Auth0 "sub"
  display_name  text not null check (char_length(display_name) between 1 and 40),
  avatar_url    text,
  friend_code   text not null unique,         -- ör. K7Q2-M9XP
  created_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Arkadaşlıklar ------------------------------------------------------------
-- Her çift tek satır: user_a < user_b (alfabetik), böylece tekrar istek imkânsız.
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  user_a        text not null,
  user_b        text not null,
  requested_by  text not null,
  status        text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  check (user_a < user_b),
  check (requested_by in (user_a, user_b)),
  unique (user_a, user_b)
);
create index if not exists friendships_user_a_idx on public.friendships (user_a);
create index if not exists friendships_user_b_idx on public.friendships (user_b);
alter table public.friendships enable row level security;

-- Ortak içerik: friendship_id boş = kişisel, dolu = o arkadaşlığın ortak alanı.
-- Arkadaşlık silinirse içerik kaybolmaz, ekleyen kişinin kişisel alanına döner.
alter table public.photos
  add column if not exists friendship_id uuid references public.friendships (id) on delete set null;
create index if not exists photos_friendship_idx on public.photos (friendship_id, created_at desc);

alter table public.activities
  add column if not exists friendship_id uuid references public.friendships (id) on delete set null;
create index if not exists activities_friendship_idx on public.activities (friendship_id, created_at desc);

-- Notlar -------------------------------------------------------------------
create table if not exists public.notes (
  id             uuid primary key default gen_random_uuid(),
  friendship_id  uuid not null references public.friendships (id) on delete cascade,
  author_id      text not null,
  body           text not null check (char_length(body) between 1 and 280),
  created_at     timestamptz not null default now(),
  read_at        timestamptz
);
create index if not exists notes_friendship_idx on public.notes (friendship_id, created_at desc);
alter table public.notes enable row level security;
