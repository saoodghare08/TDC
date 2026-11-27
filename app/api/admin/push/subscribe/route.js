import { NextResponse } from 'next/server';
import {
    queryPg,
    verifyAdminSession,
    evaluateClientReminderAlerts,
} from '@/utils/push/webPushServer';

export const dynamic = 'force-dynamic';

// GET /api/admin/push/subscribe?endpoint=...
// Returns subscription status, active device count, and live due client alerts for the Bell UI.
export async function GET(request) {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const endpoint = request.nextUrl.searchParams.get('endpoint') || '';

        const [{ rows: countRows }, subCheck, alertsData] = await Promise.all([
            queryPg(
                `SELECT COUNT(*)::int AS count FROM admin_push_subscriptions WHERE is_active = true;`
            ),
            endpoint
                ? queryPg(
                      `SELECT id, device_label FROM admin_push_subscriptions WHERE endpoint = $1 AND is_active = true LIMIT 1;`,
                      [endpoint]
                  )
                : Promise.resolve({ rows: [] }),
            evaluateClientReminderAlerts(),
        ]);

        return NextResponse.json({
            vapidConfigured: Boolean(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
            ),
            vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            activeDevicesCount: countRows[0]?.count || 0,
            isCurrentDeviceSubscribed: subCheck.rows.length > 0,
            todayIso: alertsData.todayIso,
            alerts: alertsData.liveFeedAlerts,
        });
    } catch (err) {
        console.error('GET /api/admin/push/subscribe error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to load push status' },
            { status: 500 }
        );
    }
}

// POST /api/admin/push/subscribe
// Registers or updates a browser/PWA PushSubscription for the authenticated Admin.
export async function POST(request) {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const subscription = body?.subscription;
        const endpoint = subscription?.endpoint;
        const p256dh = subscription?.keys?.p256dh;
        const authSecret = subscription?.keys?.auth;
        const deviceLabel = String(body?.deviceLabel || 'Admin Device').slice(0, 100);
        const userAgent = String(request.headers.get('user-agent') || '').slice(0, 300);

        if (!endpoint || !p256dh || !authSecret) {
            return NextResponse.json(
                { error: 'Invalid PushSubscription payload (missing endpoint or encryption keys).' },
                { status: 400 }
            );
        }

        await queryPg(
            `
            INSERT INTO admin_push_subscriptions (user_id, endpoint, p256dh, auth, device_label, user_agent, is_active, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, true, now())
            ON CONFLICT (endpoint)
            DO UPDATE SET
                user_id = EXCLUDED.user_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                device_label = EXCLUDED.device_label,
                user_agent = EXCLUDED.user_agent,
                is_active = true,
                updated_at = now();
            `,
            [auth.user.id, endpoint, p256dh, authSecret, deviceLabel, userAgent]
        );

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('POST /api/admin/push/subscribe error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to save push subscription' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/push/subscribe
// Unsubscribes the current device endpoint.
export async function DELETE(request) {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const endpoint =
            body?.endpoint || request.nextUrl.searchParams.get('endpoint') || '';

        if (!endpoint) {
            return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
        }

        await queryPg(`DELETE FROM admin_push_subscriptions WHERE endpoint = $1;`, [endpoint]);
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('DELETE /api/admin/push/subscribe error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to remove push subscription' },
            { status: 500 }
        );
    }
}
