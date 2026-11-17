-- ==============================================================================
-- CLIENT CRM: 1-TO-MANY DIET PLANS & INVOICES SCHEMA
-- Relationships:
--   clients (1) ──< client_diet_plans (Many)
--   clients (1) ──< client_invoices   (Many)
-- ==============================================================================

-- 1. Parent Table: CLIENTS (1 side — Admin-managed client records, no portal login required)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT,
    age TEXT,
    height TEXT,
    instagram TEXT,
    initial_goals TEXT,
    notes TEXT,
    assigned_plan_type TEXT,
    plan_start_date DATE,
    plan_end_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Safely upgrade existing `clients` table if created by earlier migration
ALTER TABLE clients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS age TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Child Table: CLIENT DIET PLANS (Many side — 1 Client -> Many Diet Plans / Revisions)
CREATE TABLE IF NOT EXISTS client_diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL DEFAULT 1,
    plan_title TEXT NOT NULL DEFAULT 'Diet Plan',
    goal TEXT,
    calories TEXT,
    start_date DATE,
    end_date DATE,
    pdf_theme TEXT DEFAULT 'clinical',
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Child Table: CLIENT INVOICES (Many side — 1 Client -> Many Invoices)
CREATE TABLE IF NOT EXISTS client_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    invoice_date DATE,
    goal TEXT,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partly_paid')),
    currency TEXT DEFAULT 'INR',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    invoice_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR FAST CLIENT LOOKUP & 1-TO-MANY REVISION QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients(full_name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_diet_plans_client_updated
    ON client_diet_plans(client_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_diet_plans_updated_at
    ON client_diet_plans(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_invoices_client_updated
    ON client_invoices(client_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_invoices_updated_at
    ON client_invoices(updated_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) — Authenticated Admin Full CRUD
-- ==============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;

-- Clients Policies
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Authenticated users can view all clients"
    ON clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients"
    ON clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
    ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
    ON clients FOR DELETE TO authenticated USING (true);

-- Client Diet Plans Policies
DROP POLICY IF EXISTS "Admin full select on client_diet_plans" ON client_diet_plans;
DROP POLICY IF EXISTS "Admin full insert on client_diet_plans" ON client_diet_plans;
DROP POLICY IF EXISTS "Admin full update on client_diet_plans" ON client_diet_plans;
DROP POLICY IF EXISTS "Admin full delete on client_diet_plans" ON client_diet_plans;

CREATE POLICY "Admin full select on client_diet_plans"
    ON client_diet_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full insert on client_diet_plans"
    ON client_diet_plans FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin full update on client_diet_plans"
    ON client_diet_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full delete on client_diet_plans"
    ON client_diet_plans FOR DELETE TO authenticated USING (true);

-- Client Invoices Policies
DROP POLICY IF EXISTS "Admin full select on client_invoices" ON client_invoices;
DROP POLICY IF EXISTS "Admin full insert on client_invoices" ON client_invoices;
DROP POLICY IF EXISTS "Admin full update on client_invoices" ON client_invoices;
DROP POLICY IF EXISTS "Admin full delete on client_invoices" ON client_invoices;

CREATE POLICY "Admin full select on client_invoices"
    ON client_invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full insert on client_invoices"
    ON client_invoices FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin full update on client_invoices"
    ON client_invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full delete on client_invoices"
    ON client_invoices FOR DELETE TO authenticated USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

