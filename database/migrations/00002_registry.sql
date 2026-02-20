-- Migration: registry
-- Created: 2026-02-20

-- Registry table for users to save drugs of interest
CREATE TABLE registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, drug_id)
);

CREATE INDEX idx_registry_user ON registry(user_id);
CREATE INDEX idx_registry_drug ON registry(drug_id);
