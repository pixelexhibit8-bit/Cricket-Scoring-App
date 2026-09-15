-- ============================================================================
-- CRICFLOW INDUSTRY-STANDARD DATABASE SCHEMA (CREX / CricHeroes Architecture)
-- Normalized, Relational, Event-Driven Ball-by-Ball Engine
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TOURNAMENTS (Series & Leagues)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT,
    season TEXT DEFAULT '2026',
    category TEXT DEFAULT 'OPEN', -- 'OPEN' | 'CORPORATE' | 'COMMUNITY' | 'SCHOOL' | 'COLLEGE' | 'TURF'
    format TEXT DEFAULT 'LIMITED OVERS', -- 'T20' | 'LIMITED OVERS' | 'BOX CRICKET' | 'TEST'
    ball_type TEXT DEFAULT 'tennis', -- 'tennis_red' | 'tennis_green' | 'leather' | 'plastic'
    pitch_type TEXT DEFAULT 'turf', -- 'turf' | 'matting' | 'cement' | 'grass'
    city TEXT DEFAULT 'Local Ground',
    venue TEXT DEFAULT 'Local Ground',
    banner_uri TEXT,
    logo_uri TEXT,
    organiser_name TEXT,
    organiser_phone TEXT,
    organiser_email TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'UPCOMING', -- 'UPCOMING' | 'LIVE' | 'FINISHED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TEAMS (Clubs, Franchises & Local Teams)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL,
    logo_uri TEXT,
    city TEXT DEFAULT 'Local Ground',
    captain_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TOURNAMENT_TEAMS (Junction Table linking Teams to Tournaments)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    group_name TEXT DEFAULT 'Group A',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PLAYERS (Universal Cricket Career Registry)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'All-Rounder', -- 'Top Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'
    batting_style TEXT DEFAULT 'Right Hand Bat',
    bowling_style TEXT DEFAULT 'Right Arm Medium',
    photo_url TEXT,
    phone TEXT,
    city TEXT DEFAULT 'Local Ground',
    jersey_number TEXT,
    auth_user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TOURNAMENT_SQUADS (Playing Rosters per Team in a Tournament)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    role TEXT DEFAULT 'Player',
    is_captain BOOLEAN DEFAULT false,
    is_keeper BOOLEAN DEFAULT false,
    jersey_number TEXT,
    UNIQUE(tournament_id, team_id, player_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MATCHES (Quick Ground & Tournament Fixtures)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    tournament_name TEXT,
    match_title TEXT NOT NULL,
    match_code TEXT UNIQUE, -- e.g. 'CF-8053'
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team1_name TEXT NOT NULL,
    team2_name TEXT NOT NULL,
    toss_winner_name TEXT,
    toss_decision TEXT DEFAULT 'BAT', -- 'BAT' | 'BOWL'
    phase TEXT NOT NULL DEFAULT 'setup', -- 'setup' | 'playing' | 'inningBreak' | 'result'
    status TEXT NOT NULL DEFAULT 'UPCOMING', -- 'UPCOMING' | 'LIVE' | 'FINISHED'
    inning INT NOT NULL DEFAULT 1,
    max_overs INT NOT NULL DEFAULT 20,
    target INT DEFAULT NULL,
    winner_team_name TEXT DEFAULT NULL,
    result_text TEXT DEFAULT NULL,
    venue TEXT DEFAULT 'Local Ground',
    ball_type TEXT DEFAULT 'tennis',
    pitch_type TEXT DEFAULT 'turf',
    scorer_name TEXT,
    scorer_pin TEXT,
    match_data JSONB DEFAULT '{}'::jsonb, -- backward compatibility snapshot
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. INNINGS (1st & 2nd Innings of a Match)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS innings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    inning_number INT NOT NULL, -- 1 or 2
    batting_team_name TEXT NOT NULL,
    bowling_team_name TEXT NOT NULL,
    runs INT DEFAULT 0,
    wickets INT DEFAULT 0,
    overs NUMERIC(4,1) DEFAULT 0.0,
    total_legal_balls INT DEFAULT 0,
    target_runs INT DEFAULT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, inning_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. DELIVERIES (CREX / CricHeroes Core Event-Driven Ball-by-Ball)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    inning_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
    over_number INT NOT NULL, -- 0-indexed (0 = 1st over, 1 = 2nd over)
    ball_number INT NOT NULL, -- 1 to 6 (or legal ball count)
    bowler_name TEXT NOT NULL,
    batsman_name TEXT NOT NULL,
    non_striker_name TEXT NOT NULL,
    runs_bat INT DEFAULT 0, -- 0, 1, 2, 3, 4, 6
    extras_type TEXT DEFAULT NULL, -- 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty'
    extras_runs INT DEFAULT 0,
    total_runs INT DEFAULT 0, -- runs_bat + extras_runs
    is_legal BOOLEAN DEFAULT true, -- false for wide or no-ball
    is_wicket BOOLEAN DEFAULT false,
    dismissal_type TEXT DEFAULT NULL, -- 'bowled' | 'caught' | 'run_out' | 'lbw' | 'stumped' | 'hit_wicket'
    dismissed_player_name TEXT DEFAULT NULL,
    fielder_name TEXT DEFAULT NULL,
    wagon_zone TEXT DEFAULT NULL, -- 'cover' | 'mid_wicket' | 'long_on' | 'straight' | 'fine_leg' | 'third_man'
    ball_token TEXT NOT NULL, -- '0', '1', '2', '4', '6', 'W', 'Wd', 'Nb'
    commentary TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. POINTS_TABLE (Official Tournament Standings)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS points_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    short_name TEXT,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    lost INT DEFAULT 0,
    no_result INT DEFAULT 0,
    points INT DEFAULT 0,
    net_run_rate NUMERIC(6,3) DEFAULT 0.000,
    runs_scored INT DEFAULT 0,
    balls_faced INT DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    balls_bowled INT DEFAULT 0,
    form TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, team_name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. INDEXES FOR LIGHTNING SPEED (Crex 0.01s Query Performance)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_deliveries_match_inning ON deliveries(match_id, inning_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_batsman ON deliveries(batsman_name);
CREATE INDEX IF NOT EXISTS idx_deliveries_bowler ON deliveries(bowler_name);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_points_table_tournament ON points_table(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_squads_tourn ON tournament_squads(tournament_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. ROW LEVEL SECURITY (RLS) & POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_table ENABLE ROW LEVEL SECURITY;

-- Public read & write policies for active app operations
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY['tournaments', 'teams', 'tournament_teams', 'players', 'tournament_squads', 'matches', 'innings', 'deliveries', 'points_table'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public read on %s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public read on %s" ON %I FOR SELECT USING (true);', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow insert on %s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow insert on %s" ON %I FOR INSERT WITH CHECK (true);', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow update on %s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow update on %s" ON %I FOR UPDATE USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. ENABLE SUPABASE REALTIME STREAMING FOR LIVE ENGINE
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE innings;
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE points_table;
