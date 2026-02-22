-- Client Portal Database Schema
-- Tables: clients, diet_plans, progress_entries

-- ============================================
-- 1. CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    instagram TEXT,
    initial_goals TEXT,
    assigned_plan_type TEXT, -- e.g., "1 Month Plan", "3 Month Plan", "6 Month Plan"
    plan_start_date DATE,
    plan_end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. DIET PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT NOT NULL, -- e.g., "Week 1 - High Protein"
    file_url TEXT NOT NULL, -- URL from Supabase Storage
    notes TEXT, -- Admin notes
    uploaded_by UUID REFERENCES auth.users(id), -- Admin user who uploaded
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PROGRESS ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS progress_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5, 2), -- e.g., 70.50 kg
    chest_cm NUMERIC(5, 2),
    waist_cm NUMERIC(5, 2),
    hips_cm NUMERIC(5, 2),
    photo_url TEXT, -- URL from Supabase Storage
    notes TEXT, -- Client's notes about their progress
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_id ON diet_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_client_id ON progress_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_date ON progress_entries(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;

-- CLIENTS TABLE POLICIES
-- Clients can read their own data
CREATE POLICY "Clients can view own profile"
    ON clients FOR SELECT
    USING (auth.uid() = user_id);

-- Clients can update their own data (limited fields)
CREATE POLICY "Clients can update own profile"
    ON clients FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can do everything (assuming admin users have a specific role or are identified differently)
-- For now, we'll allow authenticated users to insert (admin creates clients)
CREATE POLICY "Authenticated users can insert clients"
    ON clients FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all clients"
    ON clients FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients"
    ON clients FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients"
    ON clients FOR DELETE
    USING (auth.role() = 'authenticated');

-- DIET PLANS TABLE POLICIES
-- Clients can only view their own diet plans
CREATE POLICY "Clients can view own diet plans"
    ON diet_plans FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Admins can insert diet plans
CREATE POLICY "Authenticated users can insert diet plans"
    ON diet_plans FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Admins can update diet plans
CREATE POLICY "Authenticated users can update diet plans"
    ON diet_plans FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Admins can delete diet plans
CREATE POLICY "Authenticated users can delete diet plans"
    ON diet_plans FOR DELETE
    USING (auth.role() = 'authenticated');

-- PROGRESS ENTRIES TABLE POLICIES
-- Clients can view and create their own progress entries
CREATE POLICY "Clients can view own progress"
    ON progress_entries FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can insert own progress"
    ON progress_entries FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Clients can update their own progress entries
CREATE POLICY "Clients can update own progress"
    ON progress_entries FOR UPDATE
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Clients can delete their own progress entries
CREATE POLICY "Clients can delete own progress"
    ON progress_entries FOR DELETE
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Admins can view all progress entries
CREATE POLICY "Authenticated users can view all progress"
    ON progress_entries FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admins can delete any progress entries
CREATE POLICY "Authenticated users can delete all progress"
    ON progress_entries FOR DELETE
    USING (auth.role() = 'authenticated');

-- Admins can update any progress entries
CREATE POLICY "Authenticated users can update all progress"
    ON progress_entries FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Admins can insert progress entries
CREATE POLICY "Authenticated users can insert all progress"
    ON progress_entries FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- NOTE: Also required for diet_plans (run if not already applied):
-- CREATE POLICY "Authenticated users can view all diet plans"
--     ON diet_plans FOR SELECT
--     USING (auth.role() = 'authenticated');

-- ============================================
-- STORAGE BUCKET SETUP (Run in Supabase Dashboard Storage section)
-- ============================================
-- Create two buckets:
-- 1. 'diet-plans' - for PDF/image files of diet plans
-- 2. 'progress-photos' - for client progress photos

-- Bucket: diet-plans
-- Policy: Authenticated users can upload, clients can read their assigned plans

-- Bucket: progress-photos  
-- Policy: Clients can upload to their own folder, admins can view all

-- Run these in the Supabase Storage UI or via SQL:
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('diet-plans', 'diet-plans', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);

-- Storage policies for diet-plans bucket
CREATE POLICY "Authenticated users can upload diet plans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'diet-plans');

CREATE POLICY "Users can read diet plans"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'diet-plans');

-- Storage policies for progress-photos bucket
CREATE POLICY "Authenticated users can upload progress photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'progress-photos');

CREATE POLICY "Users can read progress photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'progress-photos');
*/
