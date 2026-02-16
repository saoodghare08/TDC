'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';

export default function Testimonials({ initialReviews }) {
    const scrollRef = useRef(null);
    const [reviews, setReviews] = useState(initialReviews && initialReviews.length > 0 ? initialReviews : data.testimonials);
    const [selectedReview, setSelectedReview] = useState(null);

    // Initial state is already set from prop or fallback, no need for client-side useEffect fetch
    // unless we wanted real-time updates, which contradicts the 6-day cache requirement.

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -400 : 400;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <Section id="reviews" className="bg-white">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="w-full md:w-auto">
                    <h2 className="text-4xl font-heading font-bold text-heading">Happy Clients</h2>
                    <p className="text-gray-500 mt-2">Real stories of transformation and health.</p>
                </div>

                <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-4">
                    <Link
                        href="/share-story"
                        className="px-6 py-3 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition mr-0 md:mr-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        Share Your Story
                    </Link>
                    <div className="flex gap-2">
                        <button onClick={() => scroll('left')} className="p-2 border rounded-full hover:bg-black hover:text-white transition"><ChevronLeft /></button>
                        <button onClick={() => scroll('right')} className="p-2 border rounded-full hover:bg-black hover:text-white transition"><ChevronRight /></button>
                    </div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
            >
                {reviews.map((t, i) => (
                    <div
                        key={i}
                        className="min-w-[300px] md:min-w-[400px] bg-gray-50 p-8 rounded-3xl snap-start border border-gray-100 flex flex-col"
                    >
                        <Quote className="text-primary/20 mb-4" size={40} />
                        <div
                            className="cursor-pointer group flex-1 mb-6"
                            onClick={() => setSelectedReview(t)}
                        >
                            <p className="text-gray-600 italic leading-relaxed line-clamp-6 group-hover:text-gray-900 transition-colors">
                                "{t.content || t.text}"
                            </p>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-3 inline-block group-hover:text-black transition-colors border-b border-transparent group-hover:border-black">
                                Read Full Review
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-auto">
                            <div>
                                <h4 className="font-bold text-heading">{t.name}</h4>
                                <p className="text-sm text-gray-400">{t.location}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Review Modal */}
            {selectedReview && (
                <div
                    className="fixed inset-0 z-1000000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedReview(null)}
                            className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-black hover:text-white rounded-full transition-colors z-101"
                        >
                            <X size={20} />
                        </button>

                        <Quote className="text-black/10 mb-6" size={60} />

                        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-xl text-gray-800 italic leading-relaxed mb-8 font-medium">
                                "{selectedReview.content || selectedReview.text}"
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                            <div>
                                <h4 className="font-bold text-heading text-lg">{selectedReview.name}</h4>
                                <p className="text-sm text-gray-400">{selectedReview.location}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Section>
    );
}
