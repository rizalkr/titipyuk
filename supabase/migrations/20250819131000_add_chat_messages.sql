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

create index if not exists chat_messages_conversation_id_idx on public.chat_messages(conversation_id);
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);

alter table public.chat_messages enable row level security;

-- Allow anyone (anon/auth) to insert (logging is server mediated; adjust if needed)
create policy if not exists "Insert chat messages" on public.chat_messages for insert with check (true);
-- Allow users to select only their own messages (system/assistant tied via conversation & user id)
create policy if not exists "Select own chat messages" on public.chat_messages for select using (auth.uid() = user_id);
