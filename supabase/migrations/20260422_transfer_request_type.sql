-- Migration: add transfer_type to member_transfers
-- Supports 'send' (default) and 'request' (money request with mandatory note)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'transfer_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.transfer_type AS ENUM ('send', 'request');
  END IF;
END $$;

ALTER TABLE public.member_transfers
  ADD COLUMN IF NOT EXISTS transfer_type public.transfer_type NOT NULL DEFAULT 'send';

-- Index for filtering requests in banner
CREATE INDEX IF NOT EXISTS idx_member_transfers_type
  ON public.member_transfers (transfer_type)
  WHERE transfer_type = 'request';

COMMENT ON COLUMN public.member_transfers.transfer_type IS
  'send = outgoing transfer initiated by sender; request = money request initiated by requester (note is mandatory)';
