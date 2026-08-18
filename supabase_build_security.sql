-- ==============================================================================
-- CricFlow Database Gatekeeper Trigger (Block Outdated APK Builds)
-- Active Build Token: CRICFLOW_PROD_BUILD_V2_2026_AUG19
-- ==============================================================================

CREATE OR REPLACE FUNCTION block_old_cricflow_apks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.match_data->>'app_build_token' IS DISTINCT FROM 'CRICFLOW_PROD_BUILD_V2_2026_AUG19' THEN
    RAISE EXCEPTION 'Blocked: Outdated APK build not allowed to write.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_block_old_cricflow_builds ON matches;
CREATE TRIGGER tr_block_old_cricflow_builds
BEFORE INSERT OR UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION block_old_cricflow_apks();
