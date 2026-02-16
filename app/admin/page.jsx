'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageSquareQuote, FileText, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

import { clearGlobalCache } from './actions';
import { RefreshCcw } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ reviews: 0, posts: 0 });
    const [clearing, setClearing] = useState(false);
    const [message, setMessage] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchStats() {
            const { count: reviewCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
            const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
            setStats({ reviews: reviewCount || 0, posts: postCount || 0 });
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

    const cards = [
        { label: 'Total Reviews', value: stats.reviews, icon: MessageSquareQuote, color: 'text-blue-500', bg: 'bg-blue-50', link: '/admin/reviews' },
        { label: 'Blog Posts', value: stats.posts, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50', link: '/admin/blog' },
        { label: 'SEO Settings', value: 'Manage', icon: Settings, color: 'text-orange-500', bg: 'bg-orange-50', link: '/admin/seo' },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-heading">Dashboard Overview</h1>
                <div className="flex items-center gap-4">
                    {message && (
                        <span className="text-sm font-medium text-green-600 animate-in fade-in slide-in-from-right-4">
                            {message}
                        </span>
                    )}
                    <button
                        onClick={handleClearCache}
                        disabled={clearing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm disabled:opacity-50"
                    >
                        <RefreshCcw size={16} className={clearing ? "animate-spin" : ""} />
                        {clearing ? 'Clearing...' : 'Clear Cache'}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <Link key={i} href={card.link} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-6 group">
                            <div className={clsx("w-16 h-16 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", card.bg, card.color)}>
                                <Icon size={32} />
                            </div>
                            <div>
                                <p className="text-gray-500 font-medium mb-1">{card.label}</p>
                                <h3 className="text-3xl font-bold text-heading">{card.value}</h3>
                            </div>
                        </Link>
                    )
                })}
            </div>

            <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    <Link href="/admin/blog/create" className="px-6 py-3 bg-heading text-white rounded-lg hover:opacity-90 transition">
                        Write New Blog Post
                    </Link>
                    <Link href="/admin/reviews" className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        Approve Pending Reviews
                    </Link>
                </div>
            </div>
        </div>
    );
}
