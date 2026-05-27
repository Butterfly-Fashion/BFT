-- Add SKU and UPC columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS upc TEXT;

-- Category-wide codes (merged cells in 상품목록 May 27 2026.xlsx)
UPDATE products SET sku = 'WC-018',    upc = '693454920187' WHERE category = 'Boxing Gloves';
UPDATE products SET sku = 'H920',      upc = '730263453458' WHERE category = 'Bucket Hats';
UPDATE products SET sku = 'EUROCAP3D', upc = '628160060137' WHERE category = 'Caps';
UPDATE products SET sku = 'EUROS',     upc = '693454000346' WHERE category = 'Car Flags';

-- Individual product codes
UPDATE products SET sku = 'MNPWC4',        upc = '5010996385284' WHERE slug = 'monopoly-panini-prizm-fifa-world-cup-26-board-game';
UPDATE products SET sku = 'FKP84',          upc = '889698937795'  WHERE slug = 'fifa-2026-clutch-funko-pop';
UPDATE products SET sku = 'FKP82',          upc = '889698937771'  WHERE slug = 'fifa-2026-maple-funko-pop';
UPDATE products SET sku = 'FKP83'                                  WHERE slug = 'fifa-2026-zayu-funko-pop';
UPDATE products SET sku = 'SCMASCANRD104', upc = '5292982072402'  WHERE slug = 'fifa-world-cup-26-canada-maple-mascot-scarf';
UPDATE products SET sku = 'PNS26WCST',     upc = '746134202848'   WHERE slug = 'panini-fifa-world-cup-2026-bundle-album-sticker-box';
UPDATE products SET sku = 'PNS26WCSA',     upc = '746134202803'   WHERE slug = 'panini-fifa-world-cup-2026-official-sticker-album';
UPDATE products SET sku = 'PNS26WCB',      upc = '746134204890'   WHERE slug = 'panini-fifa-world-cup-2026-sticker-box-50-packs';
