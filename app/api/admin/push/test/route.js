import { NextResponse } from 'next/server';
import { verifyAdminSession, broadcastPushToAdmins } from '@/utils/push/webPushServer';

export const dynamic = 'force-dynamic';

// POST /api/admin/push/test
// Sends an immediate test Web Push notification to the current device (or all subscribed Admin devices).
export async function POST(request) {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const targetEndpoint = body?.endpoint || null;

        const stats = await broadcastPushToAdmins(
            {
                title: 'The Diet Cascade — Push Active',
                body: 'Lock-screen notifications are working! You will receive 3-day, due-date, and overdue alerts automatically.',
                icon: '/images/logo.png',
                badge: '/images/logo.png',
                tag: `tdc-test-${Date.now()}`,
                url: '/admin/clients',
            },
            targetEndpoint
        );

        return NextResponse.json({ ok: true, ...stats });
    } catch (err) {
        console.error('POST /api/admin/push/test error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to send test push' },
            { status: 500 }
        );
    }
}
