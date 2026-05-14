-- Shippo label URL stored after admin purchases the label
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shippo_label_url TEXT,
  ADD COLUMN IF NOT EXISTS shippo_rate_id   TEXT;
