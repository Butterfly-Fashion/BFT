CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS hero_banners_sort_idx ON hero_banners (sort_order, created_at DESC);

-- Public storage bucket for hero banner images (same setup as lookbook-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-banners', 'hero-banners', TRUE)
ON CONFLICT (id) DO NOTHING;
