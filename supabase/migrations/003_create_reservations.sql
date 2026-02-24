-- Migration 003: Create reservations table

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_via TEXT DEFAULT 'chatbot'
    CHECK (created_via IN ('chatbot', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reservations_location_id ON reservations (location_id);
CREATE INDEX idx_reservations_date ON reservations (reservation_date);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_created_at ON reservations (created_at);

-- Updated_at trigger
CREATE TRIGGER set_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
