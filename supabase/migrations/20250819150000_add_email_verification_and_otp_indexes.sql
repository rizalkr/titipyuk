-- Add email_verified flag to profiles (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Indexes for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_email_otp_tokens_user_created ON public.email_otp_tokens(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_otp_tokens_email_created ON public.email_otp_tokens(email, created_at DESC);

-- Allow users to update their own OTP attempts (so we can increment attempts)
DO $$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_otp_tokens' AND policyname='Users can update own otp attempts'
 ) THEN
   CREATE POLICY "Users can update own otp attempts" ON public.email_otp_tokens
     FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
 END IF;
END $$;

-- Function to safely increment attempts (alternative approach) - optional
CREATE OR REPLACE FUNCTION public.increment_email_otp_attempt(p_id uuid) RETURNS void AS $$
BEGIN
  UPDATE public.email_otp_tokens SET attempts = attempts + 1 WHERE id = p_id AND used_at IS NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
