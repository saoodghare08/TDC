'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Calendar, TrendingUp, FileText, Activity, User, ArrowRight, Flame, Target, LogOut, ChevronRight } from 'lucide-react';
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
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-para text-sm font-medium animate-pulse">Syncing your health data...</p>
                </div>
            </div>
        );
    }

    if (!clientData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
                <div className="text-center w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-heading/5 border border-gray-100">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                        <User size={36} className="text-para/30" />
                    </div>
                    <h2 className="text-xl font-bold text-heading mb-3">Profile Pending</h2>
                    <p className="text-para text-sm mb-8 leading-relaxed">Your profile hasn't been initialized yet. Your coach will update this shortly.</p>
                    <a
                        href="https://wa.me/+919004491160"
                        target="_blank" rel="noopener noreferrer"
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl transition-transform duration-150 active:scale-[0.97] inline-block text-sm"
                    >
                        Inquire Status
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
        active: { bg: 'bg-primary/10', text: 'text-primary' },
        completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
        paused: { bg: 'bg-accent/10', text: 'text-accent-dark' },
    };
    const statusStyle = STATUS_STYLES[clientData.status] || { bg: 'bg-surface', text: 'text-para' };

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">

                {/* Header */}
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <p className="text-[10px] md:text-xs text-para font-bold uppercase tracking-[0.2em] mb-1">{greeting}</p>
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading">{firstName} 👋</h1>
                    </div>
                    <div className={statusStyle.bg + " " + statusStyle.text + " px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:block shadow-sm"}>
                        {clientData.status || 'Active'}
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: Target, bg: 'bg-primary/5', color: 'text-primary', label: 'Program', value: clientData.assigned_plan_type || 'General' },
                        { icon: TrendingUp, bg: 'bg-accent/5', color: 'text-accent-dark', label: 'Weight', value: latestProgress?.weight_kg ? `${latestProgress.weight_kg} kg` : '—' },
                        { icon: Activity, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Entries', value: progressCount },
                        { icon: Flame, bg: 'bg-orange-50', color: 'text-orange-600', label: 'Streak', value: daysElapsed !== null ? `${Math.max(0, daysElapsed)} days` : '—' },
                    ].map(({ icon: Icon, bg, color, label, value }) => (
                        <div key={label} className="bg-white p-5 rounded-2xl shadow-2xl shadow-heading/5 border border-gray-50 transition-transform duration-200 hover:-translate-y-1">
                            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}>
                                <Icon size={18} />
                            </div>
                            <p className="text-[10px] text-para font-bold uppercase tracking-wider mb-1">{label}</p>
                            <p className="text-sm md:text-base font-bold text-heading truncate">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <Link
                        href="/portal/plans"
                        className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-heading/5 border border-gray-50 transition-all duration-250 active:scale-[0.98] flex items-center justify-between group cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                                <FileText size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-heading text-lg">My Plans</h3>
                                <p className="text-xs text-para">Interactive diet & workout guides</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-para/30 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                    </Link>

                    <Link
                        href="/portal/progress"
                        className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-heading/5 border border-gray-50 transition-all duration-250 active:scale-[0.98] flex items-center justify-between group cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-accent/10 text-accent-dark rounded-2xl group-hover:bg-accent group-hover:text-white transition-colors">
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-heading text-lg">Log Update</h3>
                                <p className="text-xs text-para">Track measurements & weight</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-para/30 group-hover:text-accent-dark transition-colors group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* Progress Card */}
                {clientData.plan_start_date && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-heading/5 border border-gray-50 p-6 md:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg md:text-xl font-heading font-bold text-heading">Plan Tracking</h2>
                            <span className="text-[10px] font-bold text-para uppercase tracking-[0.2em]">Live Status</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-gray-50">
                                <p className="text-[10px] text-para font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar size={12} className="text-primary" /> Start Date
                                </p>
                                <p className="font-bold text-heading text-sm md:text-base">
                                    {new Date(clientData.plan_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-gray-50">
                                <p className="text-[10px] text-para font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar size={12} className="text-primary" /> End Date
                                </p>
                                <p className="font-bold text-heading text-sm md:text-base">
                                    {clientData.plan_end_date
                                        ? new Date(clientData.plan_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'Flexible'}
                                </p>
                            </div>
                            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-gray-50 col-span-2 md:col-span-1">
                                <p className="text-[10px] text-para font-bold uppercase tracking-wider mb-2">Main Goal</p>
                                <p className="font-bold text-heading text-sm md:text-base truncate">{clientData.initial_goals || 'Sustainable Growth'}</p>
                            </div>
                        </div>

                        {totalDays && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-para font-bold uppercase tracking-widest mb-1">Overall Progress</p>
                                        <p className="text-3xl font-heading font-bold text-heading leading-none">{progressPercent}%</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-lg">
                                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Goal Reach!'}
                                    </p>
                                </div>
                                <div className="h-4 bg-surface rounded-full overflow-hidden border border-gray-100 p-0.5">
                                    <div
                                        className="h-full bg-heading rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
