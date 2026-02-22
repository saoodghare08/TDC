'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    MessageSquareQuote, FileText, Settings, Users,
    RefreshCcw, PenLine, CheckCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { clearGlobalCache } from './actions';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ reviews: 0, posts: 0, clients: 0 });
    const [clearing, setClearing] = useState(false);
    const [message, setMessage] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchStats() {
            const [
                { count: reviewCount },
                { count: postCount },
                { count: clientCount }
            ] = await Promise.all([
                supabase.from('reviews').select('*', { count: 'exact', head: true }),
                supabase.from('posts').select('*', { count: 'exact', head: true }),
                supabase.from('clients').select('*', { count: 'exact', head: true }),
            ]);
            setStats({
                reviews: reviewCount || 0,
                posts: postCount || 0,
                clients: clientCount || 0,
            });
        }
        fetchStats();
    }, []);

    const handleClearCache = async () => {
        setClearing(true);
        setMessage(null);
        const result = await clearGlobalCache();
        setClearing(false);
        setMessage(result.message);
        setTimeout(() => setMessage(null), 3000);
    };

    const statCards = [
        {
            label: 'Total Clients',
            value: stats.clients,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'from-emerald-50 to-emerald-100/60',
            ring: 'ring-emerald-100',
            link: '/admin/clients',
        },
        {
            label: 'Total Reviews',
            value: stats.reviews,
            icon: MessageSquareQuote,
            color: 'text-blue-600',
            bg: 'from-blue-50 to-blue-100/60',
            ring: 'ring-blue-100',
            link: '/admin/reviews',
        },
        {
            label: 'Blog Posts',
            value: stats.posts,
            icon: FileText,
            color: 'text-purple-600',
            bg: 'from-purple-50 to-purple-100/60',
            ring: 'ring-purple-100',
            link: '/admin/blog',
        },
        {
            label: 'SEO Settings',
            value: 'Manage',
            icon: Settings,
            color: 'text-orange-600',
            bg: 'from-orange-50 to-orange-100/60',
            ring: 'ring-orange-100',
            link: '/admin/seo',
        },
    ];

    const quickActions = [
        {
            label: 'Write Blog Post',
            desc: 'Publish new content',
            href: '/admin/blog/create',
            icon: PenLine,
            accent: 'bg-heading text-white hover:bg-heading/90',
        },
        {
            label: 'Approve Reviews',
            desc: 'Manage pending reviews',
            href: '/admin/reviews',
            icon: CheckCircle,
            accent: 'bg-white text-heading border border-gray-200 hover:bg-gray-50',
        },
        {
            label: 'View Clients',
            desc: 'Manage client portal',
            href: '/admin/clients',
            icon: Users,
            accent: 'bg-white text-heading border border-gray-200 hover:bg-gray-50',
        },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-heading leading-tight">Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Welcome back, Sabah 👋</p>
                </div>

                <div className="flex items-center gap-3">
                    {message && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-right-4">
                            ✓ {message}
                        </span>
                    )}
                    <button
                        onClick={handleClearCache}
                        disabled={clearing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCcw size={14} className={clearing ? 'animate-spin' : ''} />
                        {clearing ? 'Clearing…' : 'Clear Cache'}
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ───────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.label}
                            href={card.link}
                            className={clsx(
                                "group bg-linear-to-br rounded-2xl p-4 md:p-5 ring-1 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95",
                                card.bg, card.ring
                            )}
                        >
                            <div className={clsx("w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white shadow-sm mb-3 transition-transform group-hover:scale-110", card.color)}>
                                <Icon size={18} />
                            </div>
                            <p className="text-xs font-medium text-gray-500 mb-1 leading-none">{card.label}</p>
                            <p className="text-2xl md:text-3xl font-bold text-heading leading-none">{card.value}</p>
                        </Link>
                    );
                })}
            </div>

            {/* ── Quick Actions ─────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
                <h2 className="text-base font-bold text-heading mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.label}
                                href={action.href}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm group",
                                    action.accent
                                )}
                            >
                                <Icon size={18} className="shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{action.label}</p>
                                    <p className="text-xs opacity-60 truncate">{action.desc}</p>
                                </div>
                                <ArrowRight size={14} className="shrink-0 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* ── Section Links Grid ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/admin/clients" className="group bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                        <Users size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-heading">Clients</p>
                        <p className="text-xs text-gray-400">Manage client diet plans & progress</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link href="/admin/blog" className="group bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                        <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-heading">Blog</p>
                        <p className="text-xs text-gray-400">Create and manage blog posts</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link href="/admin/reviews" className="group bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                        <MessageSquareQuote size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-heading">Reviews</p>
                        <p className="text-xs text-gray-400">Approve or reject testimonials</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link href="/admin/seo" className="group bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 transition-transform group-hover:scale-110">
                        <Settings size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-heading">SEO Settings</p>
                        <p className="text-xs text-gray-400">Manage titles, descriptions & keywords</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
            </div>

        </div>
    );
}
