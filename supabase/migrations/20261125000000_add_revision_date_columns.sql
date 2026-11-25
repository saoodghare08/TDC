-- ==============================================================================
-- SEPARATE PROGRAM END DATE & DIET PLAN REVISION DATE
-- 1. client_diet_plans: add `revision_date` (per-phase check-in / revision date)
--    alongside `start_date` and `end_date` (program / package end date).
-- 2. clients: add `next_revision_date` alongside `plan_start_date` and
--    `plan_end_date` for instant Client Directory tracking & "Revision Due" alerts.
-- ==============================================================================

ALTER TABLE client_diet_plans
    ADD COLUMN IF NOT EXISTS revision_date DATE;

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS plan_start_date DATE,
    ADD COLUMN IF NOT EXISTS plan_end_date DATE,
    ADD COLUMN IF NOT EXISTS next_revision_date DATE;

CREATE INDEX IF NOT EXISTS idx_client_diet_plans_revision_date
    ON client_diet_plans(client_id, revision_date);

CREATE INDEX IF NOT EXISTS idx_clients_next_revision_date
    ON clients(next_revision_date);

-- Reload Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
