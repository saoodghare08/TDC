'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, MessageCircle, Sparkles, X, ArrowRight, HelpCircle } from 'lucide-react';
import Section from '@/components/ui/Section';

export default function FAQClient({ initialFAQs = [] }) {
    const [faqs, setFaqs] = useState(initialFAQs);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'preset' | 'general'
    const [expandedId, setExpandedId] = useState(null);

    // Filter FAQs based on search query and category
    const filteredFAQs = useMemo(() => {
        return faqs.filter(faq => {
            // Category check
            if (activeCategory === 'preset' && !faq.is_preset) return false;
            if (activeCategory === 'general' && faq.is_preset) return false;

            // Search query check
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase().trim();
            const questionMatch = faq.question?.toLowerCase().includes(query);
            const answerMatch = faq.answer?.toLowerCase().includes(query);
            const keywordMatch = faq.keywords?.some(kw => kw.toLowerCase().includes(query));

            return questionMatch || answerMatch || keywordMatch;
        });
    }, [faqs, searchQuery, activeCategory]);

    const handleToggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const handleOpenWidget = () => {
        window.dispatchEvent(new CustomEvent('open-whatsapp-widget'));
    };

    // Dynamically generate JSON-LD schema for SEO rich results
    const schemaJson = useMemo(() => {
        if (!faqs || faqs.length === 0) return null;
        
        const mainEntity = faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer
            }
        }));

        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': mainEntity
        };
    }, [faqs]);

    return (
        <div className="relative">
            {/* Inject FAQ Schema for Search Engines */}
            {schemaJson && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
                />
            )}

            {/* Header Banner */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                {/* Decorative background blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
                
                <div className="relative z-10 px-6 max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary-200 text-xs font-semibold mb-6 uppercase tracking-wider backdrop-blur-md">
                        <Sparkles size={14} className="text-accent" />
                        Help & Support Center
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Common <span className="text-primary-200">Questions</span>
                    </h1>
                    <p className="text-white/60 max-w-xl mx-auto text-base md:text-lg font-light leading-relaxed">
                        Find instant details about plans, pricing, consultations, and how to get started on your health journey.
                    </p>
                </div>
            </div>

            {/* Search & Categories Bar */}
            <div className="max-w-4xl mx-auto px-5 -mt-8 relative z-20">
                <div className="bg-white rounded-[2rem] border border-gray-150 p-4 md:p-6 shadow-xl shadow-heading/5 flex flex-col md:flex-row gap-4 items-center">
                    {/* Search Field */}
                    <div className="relative w-full flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-para/60" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions, keywords..."
                            className="w-full pl-11 pr-10 py-3 bg-gray-50/70 border border-gray-200/80 rounded-2xl text-heading text-sm focus:outline-none focus:border-primary/50 focus:bg-white transition-all font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-para/40 hover:text-para rounded-full hover:bg-gray-150 transition"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Category Selector Chips */}
                    <div className="flex gap-2 w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar py-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'preset', label: 'Featured' },
                            { id: 'general', label: 'General' }
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    setExpandedId(null);
                                }}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                    activeCategory === cat.id
                                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                                        : 'bg-gray-50 border border-gray-150 text-para hover:bg-gray-100 hover:text-heading active:scale-95'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQs List Section */}
            <Section id="faqs" className="bg-surface py-16 md:py-24">
                <div className="max-w-3xl mx-auto">
                    {filteredFAQs.length === 0 ? (
                        <div className="text-center py-16 px-6 bg-white rounded-[2rem] border border-gray-150 shadow-sm">
                            <HelpCircle size={48} className="mx-auto text-para/30 mb-4" />
                            <h3 className="text-lg font-bold text-heading mb-2">No matching questions found</h3>
                            <p className="text-para text-sm mb-6 max-w-sm mx-auto">
                                Try searching for generic keywords like "plan", "sabah", "pricing", or click Reset below.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory('all');
                                }}
                                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredFAQs.map((faq) => {
                                const isExpanded = expandedId === faq.id;
                                return (
                                    <div
                                        key={faq.id}
                                        className={`bg-white border rounded-[1.8rem] transition-all duration-300 ${
                                            isExpanded
                                                ? 'border-primary/20 shadow-lg shadow-primary/5'
                                                : 'border-gray-150 shadow-sm hover:shadow-md hover:border-gray-250'
                                        }`}
                                    >
                                        <button
                                            onClick={() => handleToggleExpand(faq.id)}
                                            className="w-full px-6 py-5 md:px-8 text-left flex justify-between items-center gap-4 cursor-pointer"
                                        >
                                            <span className="font-heading font-bold text-base md:text-lg text-heading leading-snug">
                                                {faq.question}
                                            </span>
                                            <span className={`p-1.5 rounded-xl bg-gray-50 border border-gray-150 text-para transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary bg-primary/5 border-primary/10' : ''}`}>
                                                <ChevronDown size={18} />
                                            </span>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ 
                                                        height: 'auto', 
                                                        opacity: 1,
                                                        transition: {
                                                            height: { type: 'spring', stiffness: 200, damping: 25 },
                                                            opacity: { duration: 0.2 }
                                                        }
                                                    }}
                                                    exit={{ 
                                                        height: 0, 
                                                        opacity: 0,
                                                        transition: {
                                                            height: { duration: 0.25 },
                                                            opacity: { duration: 0.15 }
                                                        }
                                                    }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-6 md:px-8 md:pb-8 border-t border-gray-50 pt-4 text-para text-sm md:text-base leading-relaxed whitespace-pre-line">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Support Card CTA */}
                    <div className="mt-16 md:mt-24 bg-heading text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                        {/* Blob decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-[90px] translate-x-1/3 -translate-y-1/3" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="max-w-md text-center md:text-left">
                                <span className="inline-block text-accent text-xs font-bold uppercase tracking-wider mb-3">Still have questions?</span>
                                <h3 className="text-2xl md:text-3xl font-heading font-black mb-3">Let's talk on WhatsApp!</h3>
                                <p className="text-white/60 text-sm md:text-base font-light leading-relaxed">
                                    Get personalized answers instantly. Try speaking with our virtual assistant or chat directly with Dt. Sabah.
                                </p>
                            </div>
                            <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <button
                                    onClick={handleOpenWidget}
                                    className="px-6 py-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2.5 transition shadow-lg shadow-primary/20 cursor-pointer active:scale-95 duration-100"
                                >
                                    <MessageCircle size={16} />
                                    Launch AI Chat
                                </button>
                                <a
                                    href="https://wa.me/919004491160"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2.5 transition active:scale-95 duration-100"
                                >
                                    WhatsApp Direct
                                    <ArrowRight size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
}
