'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Bell,
    BellRing,
    BellOff,
    X,
    CheckCircle2,
    AlertCircle,
    Clock,
    Calendar,
    Send,
    RefreshCw,
    Smartphone,
    ArrowRight,
    MessageCircle,
} from 'lucide-react';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function detectDeviceLabel() {
    if (typeof navigator === 'undefined') return 'Admin Device';
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Safari PWA';
    if (/Android/i.test(ua)) return 'Android Browser';
    if (/Mac/i.test(ua)) return 'Mac Browser';
    if (/Win/i.test(ua)) return 'Windows Browser';
    return 'Admin Browser';
}

export function useAdminNotifications() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busyAction, setBusyAction] = useState(''); // '' | 'subscribing' | 'testing' | 'checking'
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', text: string }

    const [supported, setSupported] = useState(false);
    const [isIosBrowserTab, setIsIosBrowserTab] = useState(false);
    const [permissionState, setPermissionState] = useState('default');
    const [currentEndpoint, setCurrentEndpoint] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [activeDevicesCount, setActiveDevicesCount] = useState(0);
    const [vapidPublicKey, setVapidPublicKey] = useState(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    );
    const [alerts, setAlerts] = useState([]);

    const refreshStatus = useCallback(async (knownEndpoint = '') => {
        try {
            let endpointToCheck = knownEndpoint;

            if (
                typeof window !== 'undefined' &&
                'serviceWorker' in navigator &&
                'PushManager' in window
            ) {
                const reg = await navigator.serviceWorker.getRegistration('/');
                if (reg) {
                    const existingSub = await reg.pushManager.getSubscription();
                    if (existingSub?.endpoint) {
                        endpointToCheck = existingSub.endpoint;
                        setCurrentEndpoint(existingSub.endpoint);
                    }
                }
            }

            const qs = endpointToCheck
                ? `?endpoint=${encodeURIComponent(endpointToCheck)}`
                : '';
            const res = await fetch(`/api/admin/push/subscribe${qs}`, {
                cache: 'no-store',
            });
            if (!res.ok) return;

            const data = await res.json();
            if (data.vapidPublicKey) {
                setVapidPublicKey(data.vapidPublicKey);
            }
            setActiveDevicesCount(Number(data.activeDevicesCount || 0));
            setIsSubscribed(Boolean(data.isCurrentDeviceSubscribed && endpointToCheck));
            setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        } catch (err) {
            console.warn('Unable to fetch notification status:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (pathname === '/admin/login') return;
        if (typeof window === 'undefined') return;

        const ua = navigator.userAgent || '';
        const isIos =
            /iPhone|iPad|iPod/i.test(ua) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isStandalone =
            window.matchMedia?.('(display-mode: standalone)')?.matches ||
            window.navigator.standalone === true;

        setIsIosBrowserTab(Boolean(isIos && !isStandalone));

        const canPush =
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;
        setSupported(canPush);

        if ('Notification' in window) {
            setPermissionState(Notification.permission);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then(async (reg) => {
                    const sub = await reg.pushManager.getSubscription();
                    await refreshStatus(sub?.endpoint || '');
                })
                .catch(() => {
                    refreshStatus('');
                });
        } else {
            refreshStatus('');
        }
    }, [pathname, refreshStatus]);

    // Refresh alert counts quietly when navigating across Admin pages or opening the drawer
    useEffect(() => {
        if (pathname === '/admin/login') return;
        if (isOpen) {
            refreshStatus(currentEndpoint);
        }
    }, [isOpen, pathname, currentEndpoint, refreshStatus]);

    const handleEnablePush = async () => {
        setFeedback(null);
        if (!supported) {
            setFeedback({
                type: 'error',
                text: isIosBrowserTab
                    ? 'Add this app to your iPhone/iPad Home Screen first, then open it from the Home Screen icon.'
                    : 'Web Push is not supported in this browser.',
            });
            return;
        }

        setBusyAction('subscribing');
        try {
            const permission = await Notification.requestPermission();
            setPermissionState(permission);
            if (permission !== 'granted') {
                setFeedback({
                    type: 'error',
                    text: 'Notification permission was denied. Please allow notifications in your browser site settings.',
                });
                return;
            }

            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;

            let pubKey = vapidPublicKey;
            if (!pubKey) {
                const statusRes = await fetch('/api/admin/push/subscribe', {
                    cache: 'no-store',
                });
                const statusJson = await statusRes.json();
                pubKey = statusJson?.vapidPublicKey || '';
            }
            if (!pubKey) {
                throw new Error('Missing VAPID public key on server.');
            }

            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(pubKey),
                });
            }

            const saveRes = await fetch('/api/admin/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub.toJSON(),
                    deviceLabel: detectDeviceLabel(),
                }),
            });

            const saveJson = await saveRes.json();
            if (!saveRes.ok) {
                throw new Error(saveJson?.error || 'Could not save subscription.');
            }

            setCurrentEndpoint(sub.endpoint);
            setIsSubscribed(true);
            await refreshStatus(sub.endpoint);
            setFeedback({
                type: 'success',
                text: 'Push notifications enabled on this device!',
            });
        } catch (err) {
            setFeedback({
                type: 'error',
                text: err.message || 'Failed to enable push notifications.',
            });
        } finally {
            setBusyAction('');
        }
    };

    const handleDisablePush = async () => {
        setFeedback(null);
        setBusyAction('subscribing');
        try {
            let endpointToRemove = currentEndpoint;
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration('/');
                const sub = await reg?.pushManager.getSubscription();
                if (sub) {
                    endpointToRemove = sub.endpoint;
                    await sub.unsubscribe();
                }
            }

            if (endpointToRemove) {
                await fetch('/api/admin/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: endpointToRemove }),
                });
            }

            setCurrentEndpoint('');
            setIsSubscribed(false);
            await refreshStatus('');
            setFeedback({
                type: 'info',
                text: 'Push notifications turned off for this device.',
            });
        } catch (err) {
            setFeedback({
                type: 'error',
                text: err.message || 'Could not unsubscribe.',
            });
        } finally {
            setBusyAction('');
        }
    };

    const handleSendTestPush = async () => {
        setFeedback(null);
        setBusyAction('testing');
        try {
            const res = await fetch('/api/admin/push/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: currentEndpoint || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Test push failed.');

            if (data.delivered > 0) {
                setFeedback({
                    type: 'success',
                    text: 'Test push sent! Check your device notifications.',
                });
            } else {
                setFeedback({
                    type: 'error',
                    text: 'No active subscription received the push. Try re-enabling Push above.',
                });
            }
        } catch (err) {
            setFeedback({
                type: 'error',
                text: err.message || 'Failed to send test notification.',
            });
        } finally {
            setBusyAction('');
        }
    };

    const handleRunReminderCheckNow = async () => {
        setFeedback(null);
        setBusyAction('checking');
        try {
            const res = await fetch('/api/cron/push-reminders', {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Check failed.');

            await refreshStatus(currentEndpoint);
            if (data.newAlertsQueued > 0) {
                setFeedback({
                    type: 'success',
                    text: `Dispatched ${data.newAlertsQueued} new reminder alert(s)!`,
                });
            } else if (data.skippedDuplicates > 0) {
                setFeedback({
                    type: 'info',
                    text: `Checked ${data.evaluatedAlerts} due item(s) — today's push was already sent.`,
                });
            } else {
                setFeedback({
                    type: 'info',
                    text: 'All caught up — no client alerts due for push today.',
                });
            }
        } catch (err) {
            setFeedback({
                type: 'error',
                text: err.message || 'Failed to run reminder check.',
            });
        } finally {
            setBusyAction('');
        }
    };

    return {
        isOpen,
        setIsOpen,
        loading,
        busyAction,
        feedback,
        setFeedback,
        supported,
        isIosBrowserTab,
        permissionState,
        isSubscribed,
        activeDevicesCount,
        alerts,
        refreshStatus: () => refreshStatus(currentEndpoint),
        handleEnablePush,
        handleDisablePush,
        handleSendTestPush,
        handleRunReminderCheckNow,
    };
}

export function AdminNotificationBell({ notif }) {
    const count = notif.alerts.length;
    const hasUrgent = notif.alerts.some((a) => a.diffDays <= 0);

    return (
        <button
            type="button"
            onClick={() => {
                notif.setFeedback(null);
                notif.setIsOpen(true);
            }}
            className="relative p-2 rounded-xl text-gray-600 hover:text-heading hover:bg-gray-100 transition cursor-pointer"
            title="Notifications & Push Settings"
            aria-label="Notifications & Push Settings"
        >
            {notif.isSubscribed ? (
                <BellRing size={19} className="text-primary" />
            ) : (
                <Bell size={19} />
            )}

            {count > 0 && (
                <span
                    className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-2xs ${
                        hasUrgent ? 'bg-rose-600' : 'bg-amber-500'
                    }`}
                >
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );
}

export function AdminNotificationModal({ notif }) {
    if (!notif.isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-end p-0 sm:p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => notif.setIsOpen(false)}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[88dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
            >
                {/* Header */}
                <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Bell size={16} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-heading truncate">
                                Clinic Reminders &amp; Web Push
                            </h2>
                            <p className="text-[11px] text-gray-400 truncate">
                                3-day, due-date &amp; overdue alerts
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => notif.setIsOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        aria-label="Close notifications"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                    {/* Device Push Subscription Box */}
                    <div className="rounded-2xl border border-gray-200/90 bg-gray-50/80 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Smartphone size={15} className="text-primary shrink-0" />
                                <span className="text-xs font-bold text-heading truncate">
                                    Device Push Notifications
                                </span>
                            </div>
                            {notif.isSubscribed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                                    <CheckCircle2 size={11} />
                                    Active ({notif.activeDevicesCount}{' '}
                                    {notif.activeDevicesCount === 1 ? 'device' : 'devices'})
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-600 text-[10px] font-semibold shrink-0">
                                    <BellOff size={10} />
                                    Off on this device
                                </span>
                            )}
                        </div>

                        {notif.isIosBrowserTab && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-relaxed">
                                <strong>iPhone / iPad Setup:</strong> While on this{' '}
                                <strong>/admin</strong> screen in Safari, tap{' '}
                                <strong>Share</strong> &rarr;{' '}
                                <strong>Add to Home Screen</strong> (saves as{' '}
                                <strong>TDC Admin</strong>), then open it from your Home Screen
                                icon to enable lock-screen push alerts.
                            </div>
                        )}

                        {notif.permissionState === 'denied' && (
                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-800 leading-relaxed">
                                Notifications are blocked in browser settings. Allow
                                notifications for this site (lock/tune icon in address bar) and
                                try again.
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            {!notif.isSubscribed ? (
                                <button
                                    type="button"
                                    disabled={notif.busyAction !== ''}
                                    onClick={notif.handleEnablePush}
                                    className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {notif.busyAction === 'subscribing' ? (
                                        <RefreshCw size={13} className="animate-spin" />
                                    ) : (
                                        <BellRing size={13} />
                                    )}
                                    <span>Enable Push on This Device</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        disabled={notif.busyAction !== ''}
                                        onClick={notif.handleSendTestPush}
                                        className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                        {notif.busyAction === 'testing' ? (
                                            <RefreshCw size={12} className="animate-spin" />
                                        ) : (
                                            <Send size={12} />
                                        )}
                                        <span>Send Test Push</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={notif.busyAction !== ''}
                                        onClick={notif.handleDisablePush}
                                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                                    >
                                        Turn Off
                                    </button>
                                </>
                            )}
                        </div>

                        {notif.feedback && (
                            <p
                                className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${
                                    notif.feedback.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : notif.feedback.type === 'error'
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                            >
                                {notif.feedback.text}
                            </p>
                        )}
                    </div>

                    {/* Live Due & Upcoming Client Alerts */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                Active Client Alerts ({notif.alerts.length})
                            </span>
                            <button
                                type="button"
                                disabled={notif.busyAction !== ''}
                                onClick={notif.handleRunReminderCheckNow}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                                title="Evaluate due clients and dispatch push notifications now"
                            >
                                <RefreshCw
                                    size={11}
                                    className={
                                        notif.busyAction === 'checking' ? 'animate-spin' : ''
                                    }
                                />
                                <span>Check &amp; Push Now</span>
                            </button>
                        </div>

                        {notif.loading ? (
                            <div className="py-8 text-center text-xs text-gray-400">
                                <RefreshCw
                                    size={15}
                                    className="animate-spin mx-auto mb-1.5 text-primary"
                                />
                                Loading reminders...
                            </div>
                        ) : notif.alerts.length === 0 ? (
                            <div className="py-8 px-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
                                <CheckCircle2
                                    size={22}
                                    className="mx-auto mb-1.5 text-emerald-600"
                                />
                                <p className="text-xs font-bold text-heading">
                                    All caught up!
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    No client revisions or program expiries within the next 3
                                    days.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notif.alerts.map((item) => {
                                    const phoneDigits = String(item.clientPhone || '').replace(
                                        /\D/g,
                                        ''
                                    );
                                    const waText =
                                        item.category === 'revision'
                                            ? `Hi ${item.clientName}! 👋 Checking in for your diet plan revision scheduled on ${item.formattedDate}. Please share your latest morning weight and feedback!`
                                            : `Hi ${item.clientName}! 👋 Your current nutrition program wraps up on ${item.formattedDate}. Let's connect to review your progress and plan your next phase!`;

                                    const badgeStyle =
                                        item.severity === 'rose'
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : item.severity === 'indigo'
                                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                                : 'bg-amber-50 text-amber-800 border-amber-200';

                                    return (
                                        <div
                                            key={`${item.alertType}-${item.clientId}`}
                                            className="p-3 rounded-2xl border border-gray-200/90 hover:border-primary/40 bg-white space-y-2 transition"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-heading truncate">
                                                        {item.clientName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {item.body}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap shrink-0 ${badgeStyle}`}
                                                >
                                                    {item.diffDays <= 0 ? (
                                                        <AlertCircle size={10} />
                                                    ) : item.category === 'expiry' ? (
                                                        <Calendar size={10} />
                                                    ) : (
                                                        <Clock size={10} />
                                                    )}
                                                    <span>
                                                        {item.diffDays < 0
                                                            ? `Overdue ${Math.abs(item.diffDays)}d`
                                                            : item.diffDays === 0
                                                                ? 'Today'
                                                                : `In ${item.diffDays}d`}
                                                    </span>
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-50">
                                                {phoneDigits.length >= 8 && (
                                                    <a
                                                        href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                                                            waText
                                                        )}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition"
                                                    >
                                                        <MessageCircle size={11} />
                                                        <span>WhatsApp</span>
                                                    </a>
                                                )}
                                                <Link
                                                    href={item.actionUrl}
                                                    onClick={() => notif.setIsOpen(false)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-bold transition"
                                                >
                                                    <span>Open Client</span>
                                                    <ArrowRight size={11} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
