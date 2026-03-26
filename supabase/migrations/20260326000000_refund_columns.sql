-- Migration: colunas de rastreamento de reembolso em transactions
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
    ADD COLUMN IF NOT EXISTS refund_reason text,
    ADD COLUMN IF NOT EXISTS stripe_refund_id text;
