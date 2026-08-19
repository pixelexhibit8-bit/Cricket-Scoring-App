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

-- 3. Enable Row Level Security (RLS) & Public Access
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on matches" ON matches FOR ALL USING (true);

CREATE POLICY "Allow public read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on players" ON players FOR ALL USING (true);

ALTER TABLE local_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on local_players" ON local_players FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on local_players" ON local_players FOR ALL USING (true);

-- 4. Enable Realtime Sync for matches
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
