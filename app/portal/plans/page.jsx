'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FileText, Download, Calendar, FolderOpen, X, ZoomIn, ExternalLink, ChevronLeft, Sparkles } from 'lucide-react';
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
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-para text-sm font-medium animate-pulse">Syncing your diet archive...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">

                {/* Header */}
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/portal/dashboard" className="p-2.5 bg-white rounded-xl hover:text-primary transition-colors shadow-sm shadow-heading/5 sm:hidden">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-heading font-bold text-heading">Diet <span className="text-primary italic">Archive</span></h1>
                        <p className="text-para text-xs md:text-sm mt-0.5">Your personalized nutritional roadmap</p>
                    </div>
                </div>
                <div className="mb-10" />

                {plans.length === 0 ? (
                    <div className="bg-white p-12 sm:p-20 rounded-[2.5rem] shadow-2xl shadow-heading/5 border border-gray-50 text-center">
                        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                            <FolderOpen size={36} className="text-para/20" />
                        </div>
                        <h2 className="text-xl font-bold text-heading mb-3">Archive Empty</h2>
                        <p className="text-para text-sm mb-8 max-w-xs mx-auto">Your customized meal plans will appear here once Dt. Sabah completes your assessment.</p>
                        <a
                            href="https://wa.me/+919004491160"
                            target="_blank" rel="noopener noreferrer"
                            className="px-8 py-4 bg-primary text-white font-bold rounded-2xl transition-transform duration-150 active:scale-[0.97] inline-block text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
                        >
                            Inquire via WhatsApp
                        </a>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {plans.map((plan, idx) => (
                            <div
                                key={plan.id}
                                className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-heading/5 border border-gray-50 transition-all duration-300 hover:-translate-y-1.5 group overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                                
                                <div className="flex items-start justify-between mb-6">
                                    <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-para font-bold uppercase tracking-widest">
                                        <Calendar size={12} className="text-primary" />
                                        {new Date(plan.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-lg md:text-xl font-heading font-bold text-heading leading-tight flex-1 mb-2 group-hover:text-primary transition-colors">{plan.plan_name}</h3>
                                    {idx === 0 && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent-dark text-[10px] font-bold rounded-full uppercase tracking-widest">
                                            <Sparkles size={10} /> Latest Version
                                        </span>
                                    )}
                                </div>

                                {plan.notes && (
                                    <p className="text-xs md:text-sm text-para/60 mb-8 line-clamp-2 italic leading-relaxed">{plan.notes}</p>
                                )}

                                <div className="flex gap-3 mt-auto relative z-10">
                                    <button
                                        onClick={() => setSelectedPlan(plan)}
                                        className="flex items-center justify-center gap-2.5 flex-1 py-3.5 bg-heading text-white font-bold rounded-xl transition-all duration-150 active:scale-[0.95] text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-heading/10"
                                    >
                                        <ZoomIn size={16} />
                                        Preview
                                    </button>
                                    <a
                                        href={plan.file_url}
                                        download target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-surface text-para font-bold rounded-xl transition-all duration-150 active:scale-[0.95] hover:bg-gray-100"
                                        title="Download PDF"
                                    >
                                        <Download size={18} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium File Viewer Modal */}
            {selectedPlan && (
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-heading/60 backdrop-blur-md animate-fade-in"
                    onClick={() => setSelectedPlan(null)}
                >
                    <div
                        className="bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl w-full sm:max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-white/20"
                        style={{ animation: 'modalIn 300ms cubic-bezier(0.23, 1, 0.32, 1) both' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 md:px-10 md:py-6 border-b border-gray-50 flex-shrink-0 bg-surface/50 backdrop-blur-sm">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                                    <FileText size={20} className="text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base md:text-xl font-heading font-bold text-heading truncate">{selectedPlan.plan_name}</h2>
                                    <p className="text-[10px] md:text-xs text-para uppercase font-bold tracking-widest hidden sm:block">
                                        Uploaded {new Date(selectedPlan.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                <a
                                    href={selectedPlan.file_url} download target="_blank" rel="noopener noreferrer"
                                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-90"
                                    title="Download Document"
                                >
                                    <Download size={18} />
                                </a>
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="p-3 bg-gray-50 text-para hover:text-heading hover:bg-gray-100 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {selectedPlan.notes && (
                            <div className="px-6 py-4 md:px-10 bg-accent/5 border-b border-accent/10 flex-shrink-0">
                                <p className="text-xs md:text-sm text-accent-dark italic font-medium">Note: {selectedPlan.notes}</p>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto bg-gray-50 min-h-0 custom-scrollbar">
                            {isImage(selectedPlan.file_url) ? (
                                <div className="flex items-center justify-center p-6 md:p-12 h-full">
                                    <img src={selectedPlan.file_url} alt={selectedPlan.plan_name} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                                </div>
                            ) : isPdf(selectedPlan.file_url) ? (
                                <iframe src={selectedPlan.file_url} title={selectedPlan.plan_name} className="w-full h-full min-h-[50vh] flex-grow" style={{ border: 'none' }} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-center p-8">
                                    <FileText size={64} className="text-para/20 mb-6" />
                                    <p className="text-para mb-8 font-medium">Automatic preview is unavailable for this format.</p>
                                    <a href={selectedPlan.file_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-8 py-4 bg-heading text-white font-bold rounded-2xl hover:bg-primary transition-all duration-150 active:scale-95 text-xs uppercase tracking-widest shadow-xl shadow-heading/10">
                                        <ExternalLink size={18} /> Open in Viewer
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
