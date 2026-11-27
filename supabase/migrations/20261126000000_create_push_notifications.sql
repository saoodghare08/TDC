-- ==============================================================================
-- WEB PUSH NOTIFICATIONS & ADMIN ALERT LOGS SCHEMA
-- 1. admin_push_subscriptions: stores VAPID push endpoints per Admin device
-- 2. admin_notification_logs: stores sent notifications + unique dedupe_key
--    so cron-job.org retries never send duplicate alerts on the same day.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_label TEXT DEFAULT 'Admin Device',
    user_agent TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS admin_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    target_date DATE,
    dedupe_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT DEFAULT '/admin/clients',
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_push_subs_active
    ON admin_push_subscriptions(is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notif_logs_sent_at
    ON admin_notification_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notif_logs_unread
    ON admin_notification_logs(is_read, sent_at DESC);

ALTER TABLE admin_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated admin can manage push subscriptions" ON admin_push_subscriptions;
CREATE POLICY "Authenticated admin can manage push subscriptions"
    ON admin_push_subscriptions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin can manage notification logs" ON admin_notification_logs;
CREATE POLICY "Authenticated admin can manage notification logs"
    ON admin_notification_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
