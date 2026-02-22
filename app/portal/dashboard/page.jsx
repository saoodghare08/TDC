'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Calendar, TrendingUp, FileText, Activity, User, ArrowRight, Flame, Target } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [clientData, setClientData] = useState(null);
    const [latestProgress, setLatestProgress] = useState(null);
    const [progressCount, setProgressCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: client } = await supabase
                    .from('clients').select('*').eq('user_id', user.id).single();
                setClientData(client);

                if (client) {
                    const { data: progress } = await supabase
                        .from('progress_entries').select('*')
                        .eq('client_id', client.id)
                        .order('date', { ascending: false })
                        .limit(1).single();
                    setLatestProgress(progress);

                    const { count } = await supabase
                        .from('progress_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('client_id', client.id);
                    setProgressCount(count || 0);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading your dashboard…</p>
                </div>
            </div>
        );
    }

    if (!clientData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="text-center w-full max-w-sm bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <User size={30} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-heading mb-2">Profile Not Found</h2>
                    <p className="text-gray-500 text-sm mb-6">Your client profile hasn't been set up yet. Please contact your coach.</p>
                    <a
                        href="https://wa.me/+919004491160"
                        target="_blank" rel="noopener noreferrer"
                        className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition inline-block text-sm"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        );
    }

    const daysRemaining = clientData.plan_end_date
        ? Math.ceil((new Date(clientData.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null;
    const planStartDate = clientData.plan_start_date ? new Date(clientData.plan_start_date) : null;
    const planEndDate = clientData.plan_end_date ? new Date(clientData.plan_end_date) : null;
    const totalDays = planStartDate && planEndDate
        ? Math.ceil((planEndDate - planStartDate) / (1000 * 60 * 60 * 24)) : null;
    const daysElapsed = planStartDate
        ? Math.ceil((new Date() - planStartDate) / (1000 * 60 * 60 * 24)) : null;
    const progressPercent = totalDays && daysElapsed
        ? Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100))) : 0;

    const firstName = clientData.full_name?.split(' ')[0] || 'there';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const STATUS_STYLES = {
        active: { bg: 'bg-green-100', text: 'text-green-700' },
        completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
        paused: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    };
    const statusStyle = STATUS_STYLES[clientData.status] || { bg: 'bg-gray-100', text: 'text-gray-600' };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* ── Header ── */}
                <header className="mb-6 sm:mb-8">
                    <p className="text-sm text-gray-400 font-medium">{greeting},</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-heading">{firstName} 👋</h1>
                </header>

                {/* ── Stats Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {[
                        { icon: Target, iconBg: 'bg-blue-50', iconText: 'text-blue-600', label: 'Plan Type', value: clientData.assigned_plan_type || 'None' },
                        { icon: TrendingUp, iconBg: 'bg-green-50', iconText: 'text-green-600', label: 'Latest Weight', value: latestProgress?.weight_kg ? `${latestProgress.weight_kg} kg` : '—' },
                        { icon: Activity, iconBg: 'bg-purple-50', iconText: 'text-purple-600', label: 'Progress Logs', value: progressCount },
                        { icon: Flame, iconBg: 'bg-orange-50', iconText: 'text-orange-600', label: 'Days Active', value: daysElapsed !== null ? Math.max(0, daysElapsed) : '—' },
                    ].map(({ icon: Icon, iconBg, iconText, label, value }) => (
                        <div key={label} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className={`w-9 h-9 ${iconBg} ${iconText} rounded-xl flex items-center justify-center mb-3`}>
                                <Icon size={18} />
                            </div>
                            <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                            <p className="text-base sm:text-lg font-bold text-heading truncate">{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Quick Actions ── */}
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <Link
                        href="/portal/plans"
                        className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-heading group-hover:text-white transition-colors shrink-0">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-heading text-sm sm:text-base">View Diet Plans</h3>
                                <p className="text-xs sm:text-sm text-gray-400">Access your personalized plans</p>
                            </div>
                        </div>
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-heading transition-colors shrink-0" />
                    </Link>

                    <Link
                        href="/portal/progress"
                        className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors shrink-0">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-heading text-sm sm:text-base">Log Progress</h3>
                                <p className="text-xs sm:text-sm text-gray-400">Update your measurements</p>
                            </div>
                        </div>
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-green-600 transition-colors shrink-0" />
                    </Link>
                </div>

                {/* ── Current Plan ── */}
                {clientData.plan_start_date && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base sm:text-lg font-bold text-heading">Current Plan</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                                {clientData.status?.toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                    <Calendar size={10} /> Start
                                </p>
                                <p className="font-bold text-heading text-sm">
                                    {new Date(clientData.plan_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                    <Calendar size={10} /> End
                                </p>
                                <p className="font-bold text-heading text-sm">
                                    {clientData.plan_end_date
                                        ? new Date(clientData.plan_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : '—'}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
                                <p className="text-xs text-gray-400 mb-1">Goal</p>
                                <p className="font-bold text-heading text-sm truncate">{clientData.initial_goals || '—'}</p>
                            </div>
                        </div>

                        {totalDays && (
                            <div>
                                <div className="flex justify-between text-xs sm:text-sm mb-2">
                                    <span className="font-medium text-gray-500">Journey Progress</span>
                                    <span className="font-bold text-primary">{progressPercent}%</span>
                                </div>
                                <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-heading rounded-full transition-all duration-700"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-right text-xs text-gray-400 mt-2">
                                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Plan completed'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
