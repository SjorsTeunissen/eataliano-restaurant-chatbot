-- Migration 005: Create chat_sessions table

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (session_token already has a unique index from the UNIQUE constraint)
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions (updated_at);

-- Updated_at trigger
CREATE TRIGGER set_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
