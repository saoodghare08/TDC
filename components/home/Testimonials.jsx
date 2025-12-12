'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';

export default function Testimonials() {
    const scrollRef = useRef(null);
    const [reviews, setReviews] = useState(data.testimonials); // Initial state from JSON
    const supabase = createClient();

    useEffect(() => {
        async function fetchReviews() {
            const { data: dbReviews } = await supabase
                .from('reviews')
                .select('*')
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            // Only override if we have approved reviews
            if (dbReviews && dbReviews.length > 0) {
                setReviews(dbReviews);
            }
        }
        fetchReviews();
    }, []);

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
                        <p className="text-gray-600 italic mb-6 leading-relaxed flex-1 line-clamp-6">
                            "{t.content || t.text}"
                        </p>
                        <div className="flex items-center gap-4 mt-auto">
                            <div>
                                <h4 className="font-bold text-heading">{t.name}</h4>
                                <p className="text-sm text-gray-400">{t.location}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}
