-- Add shipping fields to products
ALTER TABLE public.products
ADD COLUMN weight numeric(12, 4),
ADD COLUMN weight_unit text DEFAULT 'oz',
ADD COLUMN length numeric(12, 2),
ADD COLUMN width numeric(12, 2),
ADD COLUMN height numeric(12, 2),
ADD COLUMN distance_unit text DEFAULT 'in';

-- Add shipping selection to orders
ALTER TABLE public.orders
ADD COLUMN shippo_rate_id text,
ADD COLUMN carrier_name text,
ADD COLUMN estimated_delivery_days integer;
