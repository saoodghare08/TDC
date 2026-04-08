'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import data from '@/data/content.json';
import Image from 'next/image';
import clsx from 'clsx';

export default function Regimen() {
    const router = useRouter();
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, offsetWidth } = scrollRef.current;
            // Calculate index based on scroll position and card width
            const index = Math.round(scrollLeft / (offsetWidth * 0.85)); // 0.82-0.85 roughly the mobile width
            setActiveIndex(index);
        }
    };

    const scrollTo = (index) => {
        if (scrollRef.current) {
            const { offsetWidth } = scrollRef.current;
            const cardWidth = window.innerWidth < 768 ? offsetWidth * 0.82 : offsetWidth;
            scrollRef.current.scrollTo({
                left: index * cardWidth,
                behavior: 'smooth'
            });
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div id="regimen" className="py-16 md:py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className='sm:text-left text-center'>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">What We Offer</h2>
                    <p className="text-gray-500 mt-2 max-w-lg">Comprehensive health and wellness regimens tailored for you.</p>
                </div>
                <div className="hidden md:flex gap-4">
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
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 px-6 md:px-12 pb-8 md:pb-12 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {data.regimens.map((item, index) => (
                    <div
                        key={index}
                        className="min-w-[82vw] md:min-w-[600px] lg:min-w-[800px] snap-center bg-gray-50 rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col md:flex-row group hover:shadow-2xl transition-all duration-300"
                    >
                        {/* Image */}
                        <div className="relative w-full md:w-2/5 h-[180px] md:h-auto overflow-hidden">
                            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10" />
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>

                        {/* Content */}
                        <div className="p-5 md:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-xl md:text-3xl font-bold font-heading mb-4 md:mb-6 text-primary group-hover:text-heading transition-colors sm:text-center italic">
                                {item.title}
                            </h3>
                            <ul className="space-y-2 md:space-y-4">
                                {item.description.map((point, i) => (
                                    <li key={i} className="flex gap-3 text-gray-600 text-sm md:text-base">
                                        <CheckCircle2 className="text-primary shrink-0 mt-0.5 md:mt-1" size={16} />
                                        <span>{point.replace(/^\d+\.\s*/, '')}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className="mt-8 px-8 py-4 md:py-3 bg-heading text-white rounded-xl w-full md:w-auto hover:bg-primary transition-colors hover:shadow-lg transform active:scale-95 cursor-pointer text-center font-bold"
                                onClick={() => router.push(`/checkout?regimen=${encodeURIComponent(item.title)}`)}
                            >
                                Enroll Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Indicators */}
            <div className="flex md:hidden justify-center items-center gap-2 mt-2">
                {data.regimens.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className={clsx(
                            "h-1.5 transition-all duration-300 rounded-full",
                            activeIndex === i ? "w-8 bg-black" : "w-1.5 bg-gray-300"
                        )}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
