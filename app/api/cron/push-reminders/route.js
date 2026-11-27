import crypto from 'crypto';
import { NextResponse } from 'next/server';
import {
    queryPg,
    verifyAdminSession,
    evaluateClientReminderAlerts,
    broadcastPushToAdmins,
} from '@/utils/push/webPushServer';

export const dynamic = 'force-dynamic';

function timingSafeMatch(a, b) {
    if (!a || !b) return false;
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

async function isAuthorizedCronOrAdmin(request) {
    const expectedSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : '';
    const headerSecret = request.headers.get('x-cron-secret') || '';
    const querySecret = request.nextUrl.searchParams.get('secret') || '';

    const providedSecret = bearerToken || headerSecret || querySecret;
    if (expectedSecret && providedSecret && timingSafeMatch(providedSecret, expectedSecret)) {
        return { ok: true, mode: 'cron' };
    }

    // Also allow logged-in Admin to trigger a check manually from the Admin UI
    const adminAuth = await verifyAdminSession();
    if (adminAuth.ok) {
        return { ok: true, mode: 'admin' };
    }

    return { ok: false };
}

async function handleCronExecution(request) {
    const auth = await isAuthorizedCronOrAdmin(request);
    if (!auth.ok) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const forceSend = request.nextUrl.searchParams.get('force') === '1' && auth.mode === 'admin';
        const { todayIso, cronAlerts } = await evaluateClientReminderAlerts();

        if (cronAlerts.length === 0) {
            return NextResponse.json({
                ok: true,
                today: todayIso,
                evaluatedAlerts: 0,
                newAlertsQueued: 0,
                skippedDuplicates: 0,
                message: 'No due revisions or expiring programs today.',
            });
        }

        const freshAlerts = [];
        let skippedDuplicates = 0;

        for (const alert of cronAlerts) {
            if (forceSend) {
                freshAlerts.push(alert);
                continue;
            }

            // Insert with ON CONFLICT DO NOTHING so cron-job.org retries never spam duplicates
            const insertRes = await queryPg(
                `
                INSERT INTO admin_notification_logs
                    (client_id, alert_type, target_date, dedupe_key, title, body, action_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (dedupe_key) DO NOTHING
                RETURNING id;
                `,
                [
                    alert.clientId,
                    alert.alertType,
                    alert.targetDate,
                    alert.dedupeKey,
                    alert.title,
                    alert.body,
                    alert.actionUrl,
                ]
            );

            if (insertRes.rowCount > 0) {
                freshAlerts.push(alert);
            } else {
                skippedDuplicates += 1;
            }
        }

        if (freshAlerts.length === 0) {
            return NextResponse.json({
                ok: true,
                today: todayIso,
                evaluatedAlerts: cronAlerts.length,
                newAlertsQueued: 0,
                skippedDuplicates,
                message: 'All alerts for today were already sent.',
            });
        }

        // Smart consolidation: 1-2 alerts -> individual client pushes; 3+ alerts -> 1 summary push
        let pushResults = [];
        if (freshAlerts.length <= 2) {
            for (const alert of freshAlerts) {
                const res = await broadcastPushToAdmins({
                    title: alert.title,
                    body: alert.body,
                    icon: '/images/logo.png',
                    badge: '/images/logo.png',
                    tag: alert.dedupeKey,
                    url: alert.actionUrl,
                    requireInteraction: alert.diffDays <= 0,
                });
                pushResults.push(res);
            }
        } else {
            const revCount = freshAlerts.filter((a) => a.category === 'revision').length;
            const expCount = freshAlerts.filter((a) => a.category === 'expiry').length;
            const parts = [];
            if (revCount > 0) {
                parts.push(`${revCount} Revision${revCount === 1 ? '' : 's'} Due`);
            }
            if (expCount > 0) {
                parts.push(`${expCount} Plan${expCount === 1 ? '' : 's'} Ending`);
            }
            const namesPreview = freshAlerts
                .slice(0, 3)
                .map((a) => a.clientName)
                .join(', ');

            const summaryRes = await broadcastPushToAdmins({
                title: `Morning Clinic Brief: ${parts.join(' & ')}`,
                body: `${namesPreview}${freshAlerts.length > 3 ? ` +${freshAlerts.length - 3} more` : ''}. Tap to review in Admin.`,
                icon: '/images/logo.png',
                badge: '/images/logo.png',
                tag: `tdc-daily-brief-${todayIso}`,
                url: revCount > 0 ? '/admin/clients?filter=revision_due' : '/admin/clients',
                requireInteraction: true,
            });
            pushResults.push(summaryRes);
        }

        return NextResponse.json({
            ok: true,
            today: todayIso,
            evaluatedAlerts: cronAlerts.length,
            newAlertsQueued: freshAlerts.length,
            skippedDuplicates,
            pushDelivery: pushResults,
        });
    } catch (err) {
        console.error('/api/cron/push-reminders error:', err);
        return NextResponse.json(
            { error: err.message || 'Cron execution failed' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    return handleCronExecution(request);
}

export async function POST(request) {
    return handleCronExecution(request);
}
