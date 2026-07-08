-- Distinguish "shipping cost not yet decided" (NULL) from "confirmed $0 shipping" (0),
-- so the payment-link flow can require an explicit shipping amount before it's sent.
alter table public.orders alter column shipping_fee drop not null;
alter table public.orders alter column shipping_fee drop default;
