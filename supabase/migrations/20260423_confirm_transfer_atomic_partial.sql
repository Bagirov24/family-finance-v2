-- Migration: extend confirm_transfer_atomic to support partial payment
-- The p_paid_amount parameter defaults to NULL which means "pay full amount"
-- (backward-compatible: existing callers without p_paid_amount still work).

CREATE OR REPLACE FUNCTION public.confirm_transfer_atomic(
  p_transfer_id UUID,
  p_paid_amount NUMERIC DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer        member_transfers%ROWTYPE;
  v_effective_amount NUMERIC;
BEGIN
  -- Lock the row to prevent concurrent double-confirms
  SELECT * INTO v_transfer
  FROM member_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
  END IF;

  IF v_transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'Transfer % is already %', p_transfer_id, v_transfer.status;
  END IF;

  -- Resolve effective amount (partial or full)
  v_effective_amount := COALESCE(p_paid_amount, v_transfer.amount);

  IF v_effective_amount <= 0 THEN
    RAISE EXCEPTION 'paid_amount must be > 0';
  END IF;

  IF v_effective_amount > v_transfer.amount THEN
    RAISE EXCEPTION 'paid_amount (%) exceeds transfer amount (%)', v_effective_amount, v_transfer.amount;
  END IF;

  -- Mark original transfer confirmed with the effective (possibly partial) amount
  UPDATE member_transfers
  SET
    status       = 'confirmed',
    amount       = v_effective_amount,
    confirmed_at = NOW()
  WHERE id = p_transfer_id;

  -- Debit sender account (if linked)
  IF v_transfer.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - v_effective_amount
    WHERE id = v_transfer.from_account_id;
  END IF;

  -- Credit recipient account (if linked)
  IF v_transfer.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + v_effective_amount
    WHERE id = v_transfer.to_account_id;
  END IF;
END;
$$;
