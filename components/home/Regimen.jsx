'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import Image from 'next/image';

export default function Regimen() {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div id="regimen" className="py-20 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6 mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading">What We Offer</h2>
                    <p className="text-gray-500 mt-2">Comprehensive health and wellness regimens tailored for you.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => scroll('left')}
                        className="p-3 rounded-full border border-gray-200 hover:bg-primary hover:text-white transition-colors"
                        aria-label="Previous Slide"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-3 rounded-full border border-gray-200 hover:bg-primary hover:text-white transition-colors"
                        aria-label="Next Slide"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 md:px-12 pb-10 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {data.regimens.map((item, index) => (
                    <div
                        key={index}
                        className="min-w-[85vw] md:min-w-[600px] lg:min-w-[800px] snap-center bg-gray-50 rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col md:flex-row group hover:shadow-2xl transition-all duration-300"
                    >
                        {/* Image */}
                        <div className="relative w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
                            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10" />
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>

                        {/* Content */}
                        <div className="p-8 md:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-2xl md:text-3xl font-bold font-heading mb-6 text-primary group-hover:text-heading transition-colors">
                                {item.title}
                            </h3>
                            <ul className="space-y-4">
                                {item.description.map((point, i) => (
                                    <li key={i} className="flex gap-3 text-gray-600 text-sm md:text-base">
                                        <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                                        <span>{point.replace(/^\d+\.\s*/, '')}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className="mt-8 px-8 py-3 bg-heading text-white rounded-xl self-start hover:bg-primary transition-colors hover:shadow-lg transform active:scale-95"
                                onClick={() => window.open(`https://wa.me/+919004491160?text=I'm interested in ${item.title}`)}
                            >
                                Enroll Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
