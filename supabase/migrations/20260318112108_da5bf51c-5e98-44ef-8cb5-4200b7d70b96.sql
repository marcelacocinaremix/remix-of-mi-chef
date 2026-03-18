
-- Fix check_and_increment_daily_uses: users can fully use their quota (e.g., 3 uses)
-- and only get blocked on the 4th attempt.
-- Logic: allow if current_uses < p_daily_limit, block if current_uses >= p_daily_limit
-- This was already correct in the DB function — no change needed here.
-- The real fix: update generate-recipe edge function check from >= to >
-- so that pre-check (READ-ONLY before increment) also uses correct logic.
-- This migration is a no-op placeholder confirming DB function is correct as-is.
SELECT 1;
