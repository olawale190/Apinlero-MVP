-- Conversation sessions for WhatsApp Knowledge Graph ordering flow
-- Tracks state machine: IDLE → ORDERING → CONFIRMING → MODIFYING → AWAITING_CLARIFICATION

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'IDLE',
  current_order JSONB DEFAULT '[]',
  pending_question TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '2 hours'
);

CREATE INDEX IF NOT EXISTS idx_sessions_phone ON conversation_sessions(customer_phone);
