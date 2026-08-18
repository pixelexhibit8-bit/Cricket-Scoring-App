-- ==============================================================================
-- CricFlow Database Cleanup: Remove Non-Google User Profiles
-- Run this in Supabase Dashboard > SQL Editor to purge test/non-Google accounts
-- ==============================================================================

-- Delete all auth users who did NOT sign up via Google Provider
DELETE FROM auth.users 
WHERE (raw_app_meta_data->>'provider' IS DISTINCT FROM 'google')
  AND (id NOT IN (
    SELECT user_id FROM auth.identities WHERE provider = 'google'
  ));

-- Delete any profiles or local_players linked to deleted non-Google users
DELETE FROM local_players 
WHERE auth_user_id IS NOT NULL 
  AND auth_user_id NOT IN (SELECT id FROM auth.users);
