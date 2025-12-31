-- PortMail: Maritime Logistics Scheduler
-- Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SHIPS TABLE
-- ============================================
CREATE TABLE ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    imo_number TEXT UNIQUE,
    default_email TEXT NOT NULL,
    vessel_type TEXT,
    flag_country TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for ships
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ships"
    ON ships FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert ships"
    ON ships FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update ships they created"
    ON ships FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete ships they created"
    ON ships FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- ============================================
-- SCHEDULED_JOBS TABLE
-- ============================================
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'sent', 'failed', 'cancelled');

CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
    ship_name TEXT NOT NULL, -- Denormalized for history
    target_email TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'Maritime Logistics Update',
    message TEXT,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    scheduled_time TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    status job_status DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_log TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for scheduled_jobs
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
    ON scheduled_jobs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
    ON scheduled_jobs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
    ON scheduled_jobs FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
    ON scheduled_jobs FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX idx_scheduled_jobs_scheduled_time ON scheduled_jobs(scheduled_time);
CREATE INDEX idx_scheduled_jobs_user_id ON scheduled_jobs(user_id);
CREATE INDEX idx_ships_name ON ships(name);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ships_updated_at
    BEFORE UPDATE ON ships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_jobs_updated_at
    BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this in Supabase Dashboard > Storage
-- Create bucket: ship-attachments
-- Set to private
-- Add policy for authenticated users to upload/download
