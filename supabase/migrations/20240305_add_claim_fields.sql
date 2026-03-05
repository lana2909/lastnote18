
-- Add email and claim_token columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS claim_token TEXT;

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS users_claim_token_idx ON public.users(claim_token);
