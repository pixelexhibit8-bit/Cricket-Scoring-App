-- ========================================================
-- CricFlow Supabase Database Schema: Tournaments
-- Copy and run this script in Supabase Dashboard -> SQL Editor
-- ========================================================

-- 1. Create Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    full_name TEXT,
    city TEXT DEFAULT 'Local Ground',
    host TEXT DEFAULT 'Local Ground',
    organiser_name TEXT,
    organiser_phone TEXT,
    organiser_email TEXT,
    start_date TEXT,
    end_date TEXT,
    duration TEXT,
    category TEXT DEFAULT 'OPEN',
    ball_type TEXT DEFAULT 'tennis',
    pitch_type TEXT DEFAULT 'turf',
    format TEXT DEFAULT 'LIMITED OVERS',
    need_more_teams BOOLEAN DEFAULT false,
    need_officials BOOLEAN DEFAULT false,
    banner_uri TEXT,
    logo_uri TEXT,
    teams JSONB DEFAULT '[]'::jsonb,
    matches JSONB DEFAULT '[]'::jsonb,
    points_table JSONB DEFAULT '[]'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- 3. Public Access Policies (Read for all viewers, Insert/Update for organizers)
DROP POLICY IF EXISTS "Allow public read on tournaments" ON tournaments;
DROP POLICY IF EXISTS "Allow insert on tournaments" ON tournaments;
DROP POLICY IF EXISTS "Allow update on tournaments" ON tournaments;
DROP POLICY IF EXISTS "Allow delete on tournaments" ON tournaments;

CREATE POLICY "Allow public read on tournaments" ON tournaments 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow insert on tournaments" ON tournaments 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow update on tournaments" ON tournaments 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

-- 4. Enable Supabase Realtime Sync for Tournaments
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
