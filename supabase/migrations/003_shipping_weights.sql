-- Add per-product box dimensions (cm) for accurate Shippo quotes
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS box_length_cm NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS box_width_cm  NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS box_height_cm NUMERIC(6,1);

-- ── Update weight_kg with research-backed values (product + typical packaging) ──
-- Sources: eBay/Amazon listings, Canada Post shipping guides, manufacturer specs
-- All weights include product + packaging materials

-- Mini souvenir boxing gloves (6-8 inch display type, ~150-200g product + box)
UPDATE public.products SET weight_kg = 0.30
WHERE category IN ('Boxing Gloves')
  AND (weight_kg IS NULL OR weight_kg = 0);

-- Baseball caps (snapback/fitted, ~100g product + 150g box)
UPDATE public.products SET weight_kg = 0.25
WHERE category IN ('Caps')
  AND (weight_kg IS NULL OR weight_kg = 0);

-- Bucket hats (foldable fan hats, ~100-150g product + poly mailer)
UPDATE public.products SET weight_kg = 0.20
WHERE category IN ('Bucket Hats')
  AND (weight_kg IS NULL OR weight_kg = 0);

-- Car window flags (~50-80g product + clip/pole + poly bag)
UPDATE public.products SET weight_kg = 0.12
WHERE category IN ('Car Flags')
  AND (weight_kg IS NULL OR weight_kg = 0);

-- Sticker packs / sticker sheets
UPDATE public.products SET weight_kg = 0.15
WHERE category IN ('Sticker Packs', 'Accessories')
  AND (weight_kg IS NULL OR weight_kg = 0);

-- Set box dimensions per category (cm) — used as fallback if not overridden per-product
UPDATE public.products SET
  box_length_cm = 22, box_width_cm = 14, box_height_cm = 10
WHERE category = 'Boxing Gloves'
  AND box_length_cm IS NULL;

UPDATE public.products SET
  box_length_cm = 22, box_width_cm = 20, box_height_cm = 14
WHERE category = 'Caps'
  AND box_length_cm IS NULL;

UPDATE public.products SET
  box_length_cm = 26, box_width_cm = 20, box_height_cm = 6
WHERE category = 'Bucket Hats'
  AND box_length_cm IS NULL;

UPDATE public.products SET
  box_length_cm = 32, box_width_cm = 16, box_height_cm = 5
WHERE category = 'Car Flags'
  AND box_length_cm IS NULL;

UPDATE public.products SET
  box_length_cm = 22, box_width_cm = 18, box_height_cm = 3
WHERE category IN ('Sticker Packs', 'Accessories')
  AND box_length_cm IS NULL;

-- Panini sticker box (50 packs, ~300-350g product + retail box)
UPDATE public.products SET
  weight_kg = 0.45,
  box_length_cm = 22, box_width_cm = 16, box_height_cm = 10
WHERE slug LIKE '%sticker-box%'
  AND box_length_cm IS NULL;

-- Panini sticker album (~250g + bubble mailer)
UPDATE public.products SET
  weight_kg = 0.35,
  box_length_cm = 24, box_width_cm = 18, box_height_cm = 3
WHERE slug LIKE '%sticker-album%'
  AND box_length_cm IS NULL;

-- Bundle (album + box, combined weight)
UPDATE public.products SET
  weight_kg = 0.80,
  box_length_cm = 24, box_width_cm = 18, box_height_cm = 12
WHERE slug LIKE '%bundle%'
  AND box_length_cm IS NULL;
