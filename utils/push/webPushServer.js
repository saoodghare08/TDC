import * as webpush from 'web-push';
import { Pool } from 'pg';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

// ─── Singleton Postgres Pool for Server/Cron Queries (Bypasses RLS Safely) ───
function getPgPool() {
    if (!globalThis.__tdcPgPool) {
        let connStr =
            process.env.POSTGRES_URL_NON_POOLING ||
            process.env.POSTGRES_URL ||
            process.env.POSTGRES_PRISMA_URL ||
            '';
        if (!connStr) {
            throw new Error(
                'Missing POSTGRES_URL / POSTGRES_URL_NON_POOLING environment variable.'
            );
        }
        connStr = connStr.replace(/[?&]sslmode=[^&]+/g, '');
        globalThis.__tdcPgPool = new Pool({
            connectionString: connStr,
            max: 3,
            idleTimeoutMillis: 15000,
            connectionTimeoutMillis: 10000,
            ssl: { rejectUnauthorized: false },
        });
    }
    return globalThis.__tdcPgPool;
}

export async function queryPg(text, params = []) {
    const pool = getPgPool();
    return pool.query(text, params);
}

// ─── Admin Cookie Auth Helper (Matches middleware.js) ───
export async function verifyAdminSession() {
    try {
        const supabase = await createServerSupabase();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return { ok: false, status: 401, error: 'Unauthorized' };
        }

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (adminEmail && user.email !== adminEmail) {
            return { ok: false, status: 403, error: 'Forbidden' };
        }

        return { ok: true, user };
    } catch (err) {
        return { ok: false, status: 500, error: err.message || 'Auth check failed' };
    }
}

// ─── Configure VAPID Once Per Runtime ───
function ensureVapidConfigured() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject =
        process.env.VAPID_SUBJECT ||
        `mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@thedietcascade.com'}`;

    if (!publicKey || !privateKey) {
        throw new Error(
            'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY environment variables.'
        );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
}

// ─── Clinic Calendar Date Helper (Timezone-Consistent YYYY-MM-DD) ───
export function getClinicTodayIso() {
    const tz = process.env.CLINIC_TIMEZONE || 'Asia/Kolkata';
    try {
        // 'en-CA' formats strictly as YYYY-MM-DD
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date());
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

function parseIsoToUtcMidnightMs(isoStr) {
    if (!isoStr) return null;
    const raw =
        isoStr instanceof Date
            ? `${isoStr.getFullYear()}-${String(isoStr.getMonth() + 1).padStart(2, '0')}-${String(
                  isoStr.getDate()
              ).padStart(2, '0')}`
            : String(isoStr).slice(0, 10);
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toIsoDateString(val) {
    if (!val) return '';
    if (val instanceof Date) {
        return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(
            val.getDate()
        ).padStart(2, '0')}`;
    }
    return String(val).slice(0, 10);
}

function formatReadableDate(isoStr) {
    const ms = parseIsoToUtcMidnightMs(isoStr);
    if (ms === null) return String(isoStr || '');
    return new Date(ms).toLocaleDateString('en-IN', {
        timeZone: 'UTC',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Evaluates active clients against confirmed alert windows:
 * - Revision Date (`next_revision_date`):
 *     - Cron Push fires at: diffDays === 3 (3 days before), diffDays === 0 (due date), and diffDays < 0 (daily while overdue)
 *     - In-App Feed shows: all diffDays <= 3 (3d, 2d, 1d, today, and overdue)
 * - Plan End Date (`plan_end_date`):
 *     - Cron Push fires at: diffDays === 3 (3 days before) and diffDays === 0 (on expiry date)
 *     - In-App Feed shows: 0 <= diffDays <= 3
 */
export async function evaluateClientReminderAlerts() {
    const todayIso = getClinicTodayIso();
    const todayMs = parseIsoToUtcMidnightMs(todayIso);

    const { rows: clients } = await queryPg(`
        SELECT id, full_name, phone, status, initial_goals, next_revision_date, plan_start_date, plan_end_date
        FROM clients
        WHERE COALESCE(status, 'active') = 'active'
          AND (next_revision_date IS NOT NULL OR plan_end_date IS NOT NULL)
        ORDER BY next_revision_date ASC NULLS LAST, plan_end_date ASC NULLS LAST;
    `);

    const cronAlerts = [];
    const liveFeedAlerts = [];

    for (const c of clients) {
        const revIso = toIsoDateString(c.next_revision_date);
        const endIso = toIsoDateString(c.plan_end_date);
        const clientUrl = `/admin/clients/${c.id}`;

        // 1. Evaluate Next Revision Date
        if (revIso) {
            const revMs = parseIsoToUtcMidnightMs(revIso);
            if (revMs !== null) {
                const diffDays = Math.round((revMs - todayMs) / 86400000);
                const formatted = formatReadableDate(revIso);

                if (diffDays <= 3) {
                    let alertType = 'revision_upcoming';
                    let title = `Revision in ${diffDays}d: ${c.full_name}`;
                    let body = `Diet plan revision is scheduled for ${formatted}.`;
                    let severity = 'amber';
                    let shouldPush = false;

                    if (diffDays < 0) {
                        const overdueDays = Math.abs(diffDays);
                        alertType = 'revision_overdue';
                        title = `Revision Overdue (${overdueDays}d): ${c.full_name}`;
                        body = `Diet revision was due on ${formatted}. Tap to prepare next phase.`;
                        severity = 'rose';
                        shouldPush = true; // Daily while overdue
                    } else if (diffDays === 0) {
                        alertType = 'revision_today';
                        title = `Revision Due Today: ${c.full_name}`;
                        body = `Diet plan revision is due today (${formatted}). Tap to revise plan.`;
                        severity = 'amber';
                        shouldPush = true; // On due date
                    } else if (diffDays === 3) {
                        alertType = 'revision_3d';
                        title = `Revision in 3 Days: ${c.full_name}`;
                        body = `Upcoming diet revision on ${formatted}.`;
                        severity = 'amber';
                        shouldPush = true; // 3 days before
                    }

                    const item = {
                        clientId: c.id,
                        clientName: c.full_name,
                        clientPhone: c.phone || '',
                        category: 'revision',
                        alertType,
                        severity,
                        diffDays,
                        targetDate: revIso,
                        formattedDate: formatted,
                        title,
                        body,
                        actionUrl: clientUrl,
                        dedupeKey: `${alertType}:${c.id}:${revIso}:${todayIso}`,
                    };

                    liveFeedAlerts.push(item);
                    if (shouldPush) {
                        cronAlerts.push(item);
                    }
                }
            }
        }

        // 2. Evaluate Program / Plan End Date
        if (endIso) {
            const endMs = parseIsoToUtcMidnightMs(endIso);
            if (endMs !== null) {
                const diffDays = Math.round((endMs - todayMs) / 86400000);
                const formatted = formatReadableDate(endIso);

                if (diffDays >= 0 && diffDays <= 3) {
                    const isToday = diffDays === 0;
                    const isThreeDays = diffDays === 3;
                    const alertType = isToday ? 'program_today' : 'program_expiring';
                    const title = isToday
                        ? `Plan Ends Today: ${c.full_name}`
                        : `Plan Ending in ${diffDays}d: ${c.full_name}`;
                    const body = isToday
                        ? `Enrolled diet package expires today (${formatted}). Follow up for renewal.`
                        : `Enrolled diet package ends on ${formatted}.`;

                    const item = {
                        clientId: c.id,
                        clientName: c.full_name,
                        clientPhone: c.phone || '',
                        category: 'expiry',
                        alertType,
                        severity: isToday ? 'rose' : 'indigo',
                        diffDays,
                        targetDate: endIso,
                        formattedDate: formatted,
                        title,
                        body,
                        actionUrl: clientUrl,
                        dedupeKey: `${alertType}:${c.id}:${endIso}:${todayIso}`,
                    };

                    liveFeedAlerts.push(item);
                    if (isToday || isThreeDays) {
                        cronAlerts.push(item);
                    }
                }
            }
        }
    }

    // Sort live alerts: most overdue/urgent first
    liveFeedAlerts.sort((a, b) => a.diffDays - b.diffDays);
    cronAlerts.sort((a, b) => a.diffDays - b.diffDays);

    return { todayIso, cronAlerts, liveFeedAlerts };
}

/**
 * Sends a Web Push notification payload to all active Admin subscriptions
 * (or a single subscription if targetEndpoint is specified).
 * Automatically prunes expired 404/410 endpoints.
 */
export async function broadcastPushToAdmins(payload, targetEndpoint = null) {
    ensureVapidConfigured();

    const params = [];
    let whereSql = 'WHERE is_active = true';
    if (targetEndpoint) {
        params.push(targetEndpoint);
        whereSql += ` AND endpoint = $1`;
    }

    const { rows: subs } = await queryPg(
        `SELECT id, endpoint, p256dh, auth FROM admin_push_subscriptions ${whereSql};`,
        params
    );

    if (subs.length === 0) {
        return { totalSubscriptions: 0, delivered: 0, failed: 0, pruned: 0 };
    }

    const serialized = JSON.stringify(payload);
    let delivered = 0;
    let failed = 0;
    let pruned = 0;

    await Promise.all(
        subs.map(async (sub) => {
            const pushSub = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                },
            };

            try {
                await webpush.sendNotification(pushSub, serialized, {
                    TTL: 86400,
                    urgency: 'high',
                });
                delivered += 1;
                await queryPg(
                    `UPDATE admin_push_subscriptions SET last_notified_at = now() WHERE id = $1;`,
                    [sub.id]
                );
            } catch (err) {
                failed += 1;
                const status = err?.statusCode;
                if (status === 404 || status === 410) {
                    pruned += 1;
                    await queryPg(`DELETE FROM admin_push_subscriptions WHERE id = $1;`, [sub.id]);
                } else {
                    console.warn('Web push send error:', status, err?.message);
                }
            }
        })
    );

    return { totalSubscriptions: subs.length, delivered, failed, pruned };
}
