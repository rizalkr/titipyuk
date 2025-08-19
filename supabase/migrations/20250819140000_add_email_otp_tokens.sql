-- Email OTP tokens table (idempotent)
create extension if not exists "pgcrypto";

create table if not exists public.email_otp_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  code_hash text not null,
  attempts int default 0 not null,
  max_attempts int default 5 not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.email_otp_tokens enable row level security;

-- Policies (select + insert own, no update except marking used via RPC)
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_otp_tokens' AND policyname='Users can insert own otp') THEN
   CREATE POLICY "Users can insert own otp" ON public.email_otp_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_otp_tokens' AND policyname='Users can view own otp meta') THEN
   CREATE POLICY "Users can view own otp meta" ON public.email_otp_tokens FOR SELECT USING (auth.uid() = user_id);
 END IF;
END $$;

-- Function to mark OTP used (SECURITY DEFINER to bypass RLS for update)
CREATE OR REPLACE FUNCTION public.mark_email_otp_used(p_id uuid) RETURNS void AS $$
BEGIN
  UPDATE public.email_otp_tokens SET used_at = now() WHERE id = p_id AND used_at IS NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Optional) Purge old tokens function
CREATE OR REPLACE FUNCTION public.purge_expired_email_otps() RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otp_tokens WHERE (expires_at < now() - interval '1 day') OR used_at IS NOT NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
