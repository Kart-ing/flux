-- AgentPay Economy Database Schema for PostgreSQL/Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('spender', 'earner', 'both')),
    balance BIGINT NOT NULL DEFAULT 0,
    hold BIGINT NOT NULL DEFAULT 0,
    total_spent BIGINT NOT NULL DEFAULT 0,
    total_earned BIGINT NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    avg_transaction_size BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused')),
    rating DECIMAL(3,2),
    completion_rate DECIMAL(5,2),
    approval_rate DECIMAL(5,2),
    categories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK(type IN ('payment', 'escrow', 'stream', 'top_up')),
    from_agent_id UUID REFERENCES agents(id),
    from_agent_name TEXT,
    to_agent_id UUID REFERENCES agents(id),
    to_agent_name TEXT,
    amount BIGINT NOT NULL,
    purpose TEXT NOT NULL,
    memo TEXT,
    status TEXT NOT NULL CHECK(status IN ('completed', 'pending', 'failed', 'cancelled')),
    consensus_required BOOLEAN NOT NULL DEFAULT FALSE,
    consensus_result JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_transactions_from_agent ON transactions(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_agent ON transactions(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_agent_id ON virtual_cards(agent_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON virtual_cards(status);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_card_number ON virtual_cards(card_number);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default demo user (password: "welcome")
-- Password hash is SHA256 of "welcome"
INSERT INTO users (username, password_hash, email)
VALUES (
    'user',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    'user@agentpay.com'
)
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (you can tighten this later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on api_keys" ON api_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on virtual_cards" ON virtual_cards FOR ALL USING (true) WITH CHECK (true);

-- Sample data seeding (optional - run this if you want demo data)

-- Sample spender agents
INSERT INTO agents (name, display_name, type, balance, total_spent, transaction_count, avg_transaction_size, status, approval_rate, categories)
VALUES
    ('growth-agent', 'Growth Agent', 'spender', 5000000, 25000000, 45, 555555, 'active', 89.5, '["Marketing", "Ads"]'::jsonb),
    ('marketing-bot', 'Marketing Bot', 'spender', 3200000, 18500000, 32, 578125, 'active', 92.3, '["Marketing", "Content"]'::jsonb),
    ('sales-assistant', 'Sales Assistant', 'spender', 7800000, 42000000, 78, 538461, 'active', 85.7, '["Operations"]'::jsonb),
    ('content-creator', 'Content Creator', 'spender', 2100000, 12300000, 28, 439285, 'active', 91.2, '["Content", "Marketing"]'::jsonb),
    ('research-agent', 'Research Agent', 'spender', 4500000, 22000000, 51, 431372, 'active', 88.4, '["Research"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Sample earner agents
INSERT INTO agents (name, display_name, type, balance, total_earned, transaction_count, avg_transaction_size, status, rating, completion_rate, categories)
VALUES
    ('api-service-provider', 'API Service Provider', 'earner', 25000000, 65000000, 145, 448275, 'active', 4.8, 96.5, '["API", "Processing"]'::jsonb),
    ('data-processing-agent', 'Data Processing Agent', 'earner', 18000000, 48000000, 102, 470588, 'active', 4.9, 98.2, '["Processing"]'::jsonb),
    ('ml-model-service', 'ML Model Service', 'earner', 32000000, 72000000, 180, 400000, 'active', 4.7, 94.8, '["ML", "API"]'::jsonb),
    ('translation-service', 'Translation Service', 'earner', 12000000, 35000000, 89, 393258, 'active', 4.9, 97.3, '["API"]'::jsonb),
    ('image-generation-service', 'Image Generation Service', 'earner', 28000000, 58000000, 125, 464000, 'active', 4.6, 93.1, '["ML", "Processing"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Sample transactions (these will reference the agents created above)
-- You may need to adjust agent IDs based on actual UUIDs generated
-- This is just a template - in practice, you'd run a script to generate these with proper IDs
