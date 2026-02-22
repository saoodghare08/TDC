'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FileText, Download, Calendar, FolderOpen, X, ZoomIn, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: client } = await supabase
                    .from('clients').select('id').eq('user_id', user.id).single();

                if (client) {
                    const { data: dietPlans } = await supabase
                        .from('diet_plans').select('*').eq('client_id', client.id)
                        .order('uploaded_at', { ascending: false });
                    setPlans(dietPlans || []);
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, [supabase]);

    const isImage = (url) => {
        if (!url) return false;
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(url.split('?')[0].split('.').pop().toLowerCase());
    };
    const isPdf = (url) => {
        if (!url) return false;
        return url.split('?')[0].split('.').pop().toLowerCase() === 'pdf';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading your diet plans…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

                {/* ── Header ── */}
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/portal/dashboard" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm sm:hidden">
                        <ArrowLeft size={18} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-heading font-bold text-heading">Your Diet Plans</h1>
                        <p className="text-gray-400 text-sm mt-0.5">Access all your personalized meal plans</p>
                    </div>
                </div>
                <div className="mb-8" />

                {plans.length === 0 ? (
                    <div className="bg-white p-10 sm:p-16 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <FolderOpen size={28} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-heading mb-2">No Plans Yet</h2>
                        <p className="text-gray-400 text-sm mb-6">Your dietitian will upload your personalized meal plans here soon.</p>
                        <a
                            href="https://wa.me/+919004491160"
                            target="_blank" rel="noopener noreferrer"
                            className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition inline-block text-sm"
                        >
                            Contact Dietitian
                        </a>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {plans.map((plan, idx) => (
                            <div
                                key={plan.id}
                                className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition shrink-0">
                                        <FileText className="text-primary" size={22} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <Calendar size={12} />
                                        {new Date(plan.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 mb-1">
                                    <h3 className="text-base sm:text-lg font-bold text-heading leading-tight flex-1">{plan.plan_name}</h3>
                                    {idx === 0 && (
                                        <span className="shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">New</span>
                                    )}
                                </div>

                                {plan.notes && (
                                    <p className="text-xs sm:text-sm text-gray-400 mb-4 line-clamp-2 italic">{plan.notes}</p>
                                )}

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setSelectedPlan(plan)}
                                        className="flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition text-sm cursor-pointer"
                                    >
                                        <ZoomIn size={16} />
                                        View
                                    </button>
                                    <a
                                        href={plan.file_url}
                                        download target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── File Viewer Modal ── */}
            {selectedPlan && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm"
                    onClick={() => setSelectedPlan(null)}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-xl shrink-0">
                                    <FileText size={18} className="text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-lg font-bold text-heading truncate">{selectedPlan.plan_name}</h2>
                                    <p className="text-xs text-gray-400 hidden sm:block">
                                        {new Date(selectedPlan.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                                <a
                                    href={selectedPlan.file_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                                >
                                    <ExternalLink size={14} />
                                    <span className="hidden sm:inline">Open</span>
                                </a>
                                <a
                                    href={selectedPlan.file_url} download target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm bg-primary hover:bg-primary-dark text-black font-semibold rounded-xl transition"
                                >
                                    <Download size={14} />
                                    <span className="hidden sm:inline">Download</span>
                                </a>
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {selectedPlan.notes && (
                            <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-50 border-b border-blue-100 shrink-0">
                                <p className="text-xs sm:text-sm text-blue-800 italic">{selectedPlan.notes}</p>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto min-h-0 bg-gray-50">
                            {isImage(selectedPlan.file_url) ? (
                                <div className="flex items-center justify-center p-4 sm:p-6 h-full">
                                    <img src={selectedPlan.file_url} alt={selectedPlan.plan_name} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                                </div>
                            ) : isPdf(selectedPlan.file_url) ? (
                                <iframe src={selectedPlan.file_url} title={selectedPlan.plan_name} className="w-full h-full min-h-[60vh]" style={{ border: 'none' }} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-16 sm:py-20 text-center p-4">
                                    <FileText size={56} className="text-gray-300 mb-4" />
                                    <p className="text-gray-500 mb-5 text-sm">This file type cannot be previewed directly.</p>
                                    <a href={selectedPlan.file_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition text-sm">
                                        <ExternalLink size={16} /> Open File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
