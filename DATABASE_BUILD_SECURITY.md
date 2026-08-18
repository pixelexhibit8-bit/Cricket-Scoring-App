# CricFlow Database & APK Build Security Guide

> **Important**: This document tracks the active APK Build Token and Supabase Database Gatekeeper Triggers so you never forget how the database security and version isolation work.

---

## 1. Current Active Build Token
- **Location in Code**: [`src/config/appBuild.js`](file:///d:/PE/CricFlowMobile/src/config/appBuild.js)
- **Current Active Token**:
  ```javascript
  export const CURRENT_BUILD_TOKEN = 'CRICFLOW_PROD_BUILD_V2_2026_AUG19';
  ```

---

## 2. How Old APKs Are Blocked

1. **In Mobile App Code (`matchService.js`)**:
   - Every match synced to Supabase automatically includes `app_build_token: CURRENT_BUILD_TOKEN`.
   - The app only fetches and listens to matches where `match_data.app_build_token === CURRENT_BUILD_TOKEN`.

2. **In Supabase Database (SQL Trigger)**:
   - Supabase has a trigger `tr_block_old_cricflow_builds` on the `matches` table.
   - Any APK without the exact `CURRENT_BUILD_TOKEN` is **rejected on insert/update with an error**.

---

## 3. How to Release a Future New Build (Step-by-Step)

When you want to release another new build in the future and block all previous APKs:

### Step 1: Change Token in Code
In [`src/config/appBuild.js`](file:///d:/PE/CricFlowMobile/src/config/appBuild.js), change the token:
```javascript
export const CURRENT_BUILD_TOKEN = 'CRICFLOW_PROD_BUILD_V3_2026_SEPT';
```

### Step 2: Update the Trigger in Supabase SQL Editor
Run this query in Supabase Dashboard > SQL Editor:
```sql
CREATE OR REPLACE FUNCTION block_old_cricflow_apks()
RETURNS TRIGGER AS $$
BEGIN
  -- Change this token to match your new CURRENT_BUILD_TOKEN:
  IF NEW.match_data->>'app_build_token' IS DISTINCT FROM 'CRICFLOW_PROD_BUILD_V3_2026_SEPT' THEN
    RAISE EXCEPTION 'Blocked: Outdated APK build not allowed to write.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. How to Temporarily Remove the Block (If Needed)
If you ever want to allow all builds to write freely without any block, run:
```sql
DROP TRIGGER IF EXISTS tr_block_old_cricflow_builds ON matches;
```
