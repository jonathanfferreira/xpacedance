-- Migration: 20260319230000_add_stripe_columns.sql
-- Description: Add Stripe columns to transactions table

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_checkout_id
    ON public.transactions(stripe_checkout_session_id);
