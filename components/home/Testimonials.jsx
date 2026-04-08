'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, X } from 'lucide-react';
import Link from 'next/link';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';

export default function Testimonials({ initialReviews }) {
    const scrollRef = useRef(null);
    const [reviews] = useState(initialReviews && initialReviews.length > 0 ? initialReviews : data.testimonials);
    const [selectedReview, setSelectedReview] = useState(null);

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
                        className="px-6 py-3 bg-black text-white text-sm font-bold rounded-full transition-transform duration-150 active:scale-[0.97] shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                        Share Your Story
                    </Link>
                    <div className="flex gap-2">
                        <button onClick={() => scroll('left')} className="p-2 border rounded-full transition-colors duration-200 hover:bg-black hover:text-white active:scale-[0.95] cursor-pointer"><ChevronLeft /></button>
                        <button onClick={() => scroll('right')} className="p-2 border rounded-full transition-colors duration-200 hover:bg-black hover:text-white active:scale-[0.95] cursor-pointer"><ChevronRight /></button>
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
                            <p className="text-gray-600 italic leading-relaxed line-clamp-6 group-hover:text-gray-900 transition-colors duration-200">
                                &ldquo;{t.content || t.text}&rdquo;
                            </p>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-3 inline-block group-hover:text-black transition-colors duration-200 border-b border-transparent group-hover:border-black">
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

            {/* Review Modal — enter from scale(0.95), CSS transition for interruptibility */}
            {selectedReview && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative"
                        style={{
                            animation: 'modalIn 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedReview(null)}
                            className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full transition-colors duration-150 hover:bg-black hover:text-white active:scale-[0.95] cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <Quote className="text-black/10 mb-6" size={60} />

                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <p className="text-xl text-gray-800 italic leading-relaxed mb-8 font-medium">
                                &ldquo;{selectedReview.content || selectedReview.text}&rdquo;
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
