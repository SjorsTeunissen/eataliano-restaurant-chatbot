-- Migration 001: Create locations table and seed data
-- Eataliano restaurant locations (Arnhem & Huissen)

-- Reusable function for updated_at trigger
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  opening_hours JSONB NOT NULL,
  delivery_zones JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_locations_is_active ON locations (is_active);

-- Updated_at trigger
CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Seed data: Arnhem location
INSERT INTO locations (name, address, phone, email, opening_hours, delivery_zones, is_active)
VALUES (
  'Arnhem',
  'Steenstraat 97, 6828 CK Arnhem',
  '026-3700111',
  'arnhem@eataliano.nl',
  '{
    "maandag": { "open": "16:00", "close": "22:00" },
    "dinsdag": { "open": "16:00", "close": "22:00" },
    "woensdag": { "open": "16:00", "close": "22:00" },
    "donderdag": { "open": "16:00", "close": "22:00" },
    "vrijdag": { "open": "16:00", "close": "23:00" },
    "zaterdag": { "open": "15:00", "close": "23:00" },
    "zondag": { "open": "15:00", "close": "22:00" }
  }'::jsonb,
  '["6811", "6812", "6813", "6814", "6815", "6821", "6822", "6823", "6824", "6825", "6826", "6827", "6828", "6829"]'::jsonb,
  true
);

-- Seed data: Huissen location
INSERT INTO locations (name, address, phone, email, opening_hours, delivery_zones, is_active)
VALUES (
  'Huissen',
  'Langestraat 96, 6851 BH Huissen',
  '026-3253700',
  'huissen@eataliano.nl',
  '{
    "maandag": { "open": "16:00", "close": "22:00" },
    "dinsdag": { "open": "16:00", "close": "22:00" },
    "woensdag": { "open": "16:00", "close": "22:00" },
    "donderdag": { "open": "16:00", "close": "22:00" },
    "vrijdag": { "open": "16:00", "close": "23:00" },
    "zaterdag": { "open": "15:00", "close": "23:00" },
    "zondag": { "open": "15:00", "close": "22:00" }
  }'::jsonb,
  '["6851", "6852", "6853", "6854", "6855"]'::jsonb,
  true
);
