-- Chat messages table for AI assistant conversations
-- Idempotent-safe: guards with DO blocks untuk policies karena IF NOT EXISTS belum ada untuk CREATE POLICY.

-- Pastikan fungsi gen_random_uuid tersedia
create extension if not exists "pgcrypto";

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model text,
  tokens int,
  created_at timestamptz default now()
);

-- Indeks
create index if not exists chat_messages_conversation_id_idx on public.chat_messages(conversation_id);
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);
create index if not exists chat_messages_conversation_created_idx on public.chat_messages(conversation_id, created_at desc);

alter table public.chat_messages enable row level security;

-- Kebijakan RLS (pakai DO block agar idempotent)
DO $$ BEGIN
  CREATE POLICY "Insert chat messages" ON public.chat_messages FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Select own chat messages" ON public.chat_messages FOR select USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- (Opsional) Kebijakan tambahan bisa ditambahkan di migrasi terpisah.
