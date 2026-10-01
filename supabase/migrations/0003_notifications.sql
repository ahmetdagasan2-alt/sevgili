-- Bizim Sitemiz: bildirimler
-- 0002_friends.sql'den sonra Supabase SQL Editor'de bir kez çalıştırın.

create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,              -- bildirimi alan kişi
  actor_id       text not null,              -- işlemi yapan kişi
  type           text not null check (type in (
                   'friend_request', 'friend_accepted', 'note', 'shared_photo',
                   'shared_activity', 'activity_done', 'puzzle_record'
                 )),
  friendship_id  uuid references public.friendships (id) on delete cascade,
  data           jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  read_at        timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
