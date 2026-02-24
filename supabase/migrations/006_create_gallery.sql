-- Migration 006: Create gallery_images table

CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_gallery_images_is_active ON gallery_images (is_active);
CREATE INDEX idx_gallery_images_sort_order ON gallery_images (sort_order);
