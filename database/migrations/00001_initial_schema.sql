-- Migration: initial_schema
-- Created: 2026-02-17

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE rx_otc_type AS ENUM ('RX', 'OTC', 'BOTH');
CREATE TYPE dea_schedule_type AS ENUM ('I', 'II', 'III', 'IV', 'V');
CREATE TYPE species_type AS ENUM ('HUMAN', 'ANIMAL', 'BOTH');
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE scrape_status AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');
CREATE TYPE fda_bulk_list_type AS ENUM ('503A_POSITIVE', '503B_POSITIVE', 'NOT_LISTED', 'WITHDRAWN');
CREATE TYPE formula_type AS ENUM ('503A', '503B');
CREATE TYPE formula_status AS ENUM ('DRAFT', 'APPROVED', 'DISCONTINUED');
CREATE TYPE compounding_regulation_type AS ENUM ('503A', '503B', 'STATE', 'USP');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Drugs table
CREATE TABLE drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ndc VARCHAR(50) UNIQUE,
    name VARCHAR(500) NOT NULL,
    generic_name VARCHAR(500),
    dosage_form VARCHAR(255),
    strength VARCHAR(255),
    route VARCHAR(255),
    manufacturer VARCHAR(500),
    rx_otc rx_otc_type NOT NULL DEFAULT 'RX',
    dea_schedule dea_schedule_type,
    species species_type NOT NULL DEFAULT 'HUMAN',
    active_ingredients JSONB,
    fda_application_number VARCHAR(50),
    marketing_status VARCHAR(100),
    source VARCHAR(50) NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drugs_ndc ON drugs(ndc);
CREATE INDEX idx_drugs_name ON drugs(name);
CREATE INDEX idx_drugs_generic_name ON drugs(generic_name);
CREATE INDEX idx_drugs_manufacturer ON drugs(manufacturer);
CREATE INDEX idx_drugs_rx_otc ON drugs(rx_otc);
CREATE INDEX idx_drugs_dea_schedule ON drugs(dea_schedule);
CREATE INDEX idx_drugs_species ON drugs(species);
CREATE INDEX idx_drugs_dosage_form ON drugs(dosage_form);
CREATE INDEX idx_drugs_source ON drugs(source);

-- Full text search index for drugs
CREATE INDEX idx_drugs_search ON drugs USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(generic_name, '') || ' ' || coalesce(manufacturer, ''))
);

-- State regulations table
CREATE TABLE state_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_code VARCHAR(2) NOT NULL,
    regulation_type VARCHAR(100) NOT NULL,
    applies_to VARCHAR(255) NOT NULL,
    description TEXT,
    source_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_state_regulations_state ON state_regulations(state_code);
CREATE INDEX idx_state_regulations_type ON state_regulations(regulation_type);

-- Discussions table
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discussions_drug ON discussions(drug_id);
CREATE INDEX idx_discussions_user ON discussions(user_id);
CREATE INDEX idx_discussions_parent ON discussions(parent_id);

-- Competitor drugs table
CREATE TABLE competitor_drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor VARCHAR(100) NOT NULL,
    drug_id UUID REFERENCES drugs(id) ON DELETE SET NULL,
    external_name VARCHAR(500) NOT NULL,
    url VARCHAR(1000),
    price DECIMAL(10, 2),
    category VARCHAR(255),
    requires_prescription BOOLEAN,
    requires_consultation BOOLEAN,
    raw_data JSONB,
    scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competitor_drugs_competitor ON competitor_drugs(competitor);
CREATE INDEX idx_competitor_drugs_drug ON competitor_drugs(drug_id);
CREATE INDEX idx_competitor_drugs_external_name ON competitor_drugs(external_name);

-- Scrape logs table
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor VARCHAR(100) NOT NULL,
    status scrape_status NOT NULL,
    drugs_found INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_logs_competitor ON scrape_logs(competitor);
CREATE INDEX idx_scrape_logs_created ON scrape_logs(created_at DESC);

-- Bulk ingredients table (for compounding)
CREATE TABLE bulk_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    cas_number VARCHAR(50),
    usp_nf_status BOOLEAN NOT NULL DEFAULT FALSE,
    fda_bulk_list fda_bulk_list_type NOT NULL DEFAULT 'NOT_LISTED',
    category VARCHAR(100),
    storage_requirements TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bulk_ingredients_name ON bulk_ingredients(name);
CREATE INDEX idx_bulk_ingredients_cas ON bulk_ingredients(cas_number);
CREATE INDEX idx_bulk_ingredients_fda_list ON bulk_ingredients(fda_bulk_list);
CREATE INDEX idx_bulk_ingredients_category ON bulk_ingredients(category);

-- Compounding formulas table
CREATE TABLE compounding_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    drug_id UUID REFERENCES drugs(id) ON DELETE SET NULL,
    dosage_form VARCHAR(100),
    route VARCHAR(100),
    species species_type NOT NULL DEFAULT 'HUMAN',
    beyond_use_date VARCHAR(100),
    formula_type formula_type NOT NULL,
    status formula_status NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compounding_formulas_name ON compounding_formulas(name);
CREATE INDEX idx_compounding_formulas_drug ON compounding_formulas(drug_id);
CREATE INDEX idx_compounding_formulas_type ON compounding_formulas(formula_type);
CREATE INDEX idx_compounding_formulas_status ON compounding_formulas(status);

-- Formula ingredients junction table
CREATE TABLE formula_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id UUID NOT NULL REFERENCES compounding_formulas(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES bulk_ingredients(id) ON DELETE RESTRICT,
    quantity VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    purpose VARCHAR(100),
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_formula_ingredients_formula ON formula_ingredients(formula_id);
CREATE INDEX idx_formula_ingredients_ingredient ON formula_ingredients(ingredient_id);

-- Compounding regulations table
CREATE TABLE compounding_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regulation_type compounding_regulation_type NOT NULL,
    state_code VARCHAR(2),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    requirements JSONB,
    source_url VARCHAR(500),
    effective_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compounding_regulations_type ON compounding_regulations(regulation_type);
CREATE INDEX idx_compounding_regulations_state ON compounding_regulations(state_code);

-- Create default admin user (password: admin123 - CHANGE IN PRODUCTION)
INSERT INTO users (email, name, password_hash, role)
VALUES (
    'admin@pharmacy.local',
    'Admin User',
    '$2b$10$rQZ8kHzL1V6P3.B6Z5qR8e8gvJ0LJnE0hYKG5k5ZqVoqT9hXYzK9m',
    'ADMIN'
);
