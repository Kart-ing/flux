-- Add Virtual Cards table to existing Supabase database
-- Run this in your Supabase SQL Editor

-- Virtual Cards table
CREATE TABLE IF NOT EXISTS virtual_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_number TEXT NOT NULL UNIQUE,
    cvv TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    card_holder_name TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_limit BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'used', 'expired', 'cancelled')),
    purpose TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    transaction_id UUID REFERENCES transactions(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_agent_id ON virtual_cards(agent_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON virtual_cards(status);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_card_number ON virtual_cards(card_number);

-- Enable Row Level Security (RLS)
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on virtual_cards" ON virtual_cards;
CREATE POLICY "Allow all operations on virtual_cards" ON virtual_cards FOR ALL USING (true) WITH CHECK (true);
