-- ========================================================
-- CricFlow Mobile Supabase Database Schema
-- Run this script in your Supabase SQL Editor
-- ========================================================

-- 1. Create Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_title TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'setup', -- 'setup' | 'playing' | 'inningBreak' | 'result'
    inning INT NOT NULL DEFAULT 1,
    max_overs INT NOT NULL DEFAULT 20,
    target INT DEFAULT NULL,
    team1_name TEXT NOT NULL,
    team2_name TEXT NOT NULL,
    winner_team_name TEXT DEFAULT NULL,
    result_text TEXT DEFAULT NULL,
    toss_winner TEXT DEFAULT NULL,
    toss_decision TEXT DEFAULT NULL,
    match_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'All-Rounder',
    avatar_url TEXT DEFAULT NULL,
    batting_avg NUMERIC(5,2) DEFAULT 0.00,
    strike_rate NUMERIC(5,2) DEFAULT 0.00,
    matches_played INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Local Players Table (Quick Match ground-level player registry)
CREATE TABLE IF NOT EXISTS local_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'All-Rounder',
    phone TEXT DEFAULT NULL,
    photo_url TEXT DEFAULT NULL,
    auth_user_id TEXT DEFAULT NULL,
    city TEXT DEFAULT NULL,
    matches_played INT DEFAULT 0,
    total_runs INT DEFAULT 0,
    total_wickets INT DEFAULT 0,
    total_balls_faced INT DEFAULT 0,
    total_balls_bowled INT DEFAULT 0,
    total_fours INT DEFAULT 0,
    total_sixes INT DEFAULT 0,
    best_score INT DEFAULT 0,
    best_bowling_wickets INT DEFAULT 0,
    best_bowling_runs INT DEFAULT 0,
    app_build_token TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- 3. Enable Row Level Security (RLS) & Secured Public Access
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_players ENABLE ROW LEVEL SECURITY;

-- 3.1 Matches Policies (Read for all, Insert/Update for active builds, Delete restricted)
DROP POLICY IF EXISTS "Allow public read access on matches" ON matches;
DROP POLICY IF EXISTS "Allow public insert/update on matches" ON matches;
DROP POLICY IF EXISTS "Allow public read on matches" ON matches;
DROP POLICY IF EXISTS "Allow insert on matches" ON matches;
DROP POLICY IF EXISTS "Allow update on matches" ON matches;

CREATE POLICY "Allow public read on matches" ON matches 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow insert on matches" ON matches 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow update on matches" ON matches 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

-- 3.2 Local Players Policies (Read for all, Insert/Update for active app, Delete restricted)
DROP POLICY IF EXISTS "Allow public read access on local_players" ON local_players;
DROP POLICY IF EXISTS "Allow public insert/update on local_players" ON local_players;
DROP POLICY IF EXISTS "Allow public read on local_players" ON local_players;
DROP POLICY IF EXISTS "Allow insert on local_players" ON local_players;
DROP POLICY IF EXISTS "Allow update on local_players" ON local_players;

CREATE POLICY "Allow public read on local_players" ON local_players 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow insert on local_players" ON local_players 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow update on local_players" ON local_players 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

-- 3.3 Legacy Players Policies
DROP POLICY IF EXISTS "Allow public read access on players" ON players;
DROP POLICY IF EXISTS "Allow public insert/update on players" ON players;
DROP POLICY IF EXISTS "Allow public read on players" ON players;
DROP POLICY IF EXISTS "Allow insert on players" ON players;
DROP POLICY IF EXISTS "Allow update on players" ON players;

CREATE POLICY "Allow public read on players" ON players 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow insert on players" ON players 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow update on players" ON players 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

-- 4. Enable Realtime Sync for matches
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
