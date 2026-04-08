'use client';

import { useState, useRef, useEffect } from 'react';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import { Package, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function Pricing() {
    const router = useRouter();
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(2);

    useEffect(() => {
        // Initial scroll to the default active index (2)
        scrollTo(1);
    }, []);

    const handleEnroll = (planTitle) => {
        router.push(`/checkout?plan=${encodeURIComponent(planTitle)}`);
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            const scrollLeft = scrollRef.current.scrollLeft;
            const index = Math.round(scrollLeft / width);
            setActiveIndex(index);
        }
    };

    const scrollTo = (index) => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            scrollRef.current.scrollTo({
                left: index * width,
                behavior: 'smooth'
            });
        }
    };

    return (
        <Section id="pricing" className="bg-linear-to-br from-blue-50/50 to-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 p-20 bg-blue-100 rounded-full blur-[100px] opacity-30 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-purple-100 rounded-full blur-[120px] opacity-30 pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

            <div className="text-center mb-10 md:mb-16 relative z-10">
                <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Our Packages</span>
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading mb-4">Plan Benefits</h2>
                <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4 md:px-0">
                    Invest in your health with our structured, expert-led nutrition plans designed for sustainable results.
                </p>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto relative z-10 px-8 md:px-0 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-8 scrollbar-hide items-stretch"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {data.pricing.map((plan, index) => {
                    const isPopular = index === 1;
                    return (
                        <div
                            key={index}
                            className={clsx(
                                "relative p-6 md:p-8 rounded-4xl flex flex-col transition-all duration-300 min-w-[75vw] md:min-w-0 snap-center",
                                isPopular
                                    ? "bg-white border-2 border-primary shadow-xl md:scale-105 z-20"
                                    : "bg-white border border-gray-100 shadow-lg md:hover:shadow-xl md:hover:-translate-y-2"
                            )}
                        >
                            {isPopular && (
                                <div className="absolute sm:-top-4 -top-1 left-1/2 -translate-x-1/2 bg-linear-to-r from-primary to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div className={clsx(
                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl font-heading font-bold",
                                isPopular ? "bg-primary/10 text-primary" : "bg-blue-50 text-blue-900"
                            )}>
                                {plan.icon}M
                            </div>

                            <h3 className="text-2xl font-bold text-heading mb-2">{plan.title}</h3>
                            <p className="text-gray-600 text-sm mb-6">Comprehensive care for {plan.title}</p>

                            <div className="h-px w-full bg-linear-to-r from-transparent via-gray-200 to-transparent mb-6"></div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex gap-3 text-gray-800 font-medium text-sm items-start">
                                        <div className="mt-0.5 p-0.5 rounded-full bg-green-100 shrink-0">
                                            <Check className="text-green-600 w-3 h-3" strokeWidth={3} />
                                        </div>
                                        <span className="leading-tight">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleEnroll(plan.title)}
                                className={clsx(
                                    "w-full py-4 rounded-xl font-bold transition-all transform active:scale-95 duration-200",
                                    isPopular
                                        ? "bg-linear-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-primary/30 hover:brightness-110 hover:cursor-pointer"
                                        : "bg-gray-50 border-2 border-gray-200 text-heading hover:border-primary hover:text-primary z-10 hover:cursor-pointer shadow-sm"
                                )}
                            >
                                Choose Plan
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Decoration & Indicators */}
            <div className="flex md:hidden justify-center items-center gap-3 mt-4 relative z-10">
                {data.pricing.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className={clsx(
                            "transition-all duration-300 rounded-full",
                            activeIndex === i
                                ? "w-8 h-2.5 bg-black"
                                : "w-2.5 h-2.5 bg-gray-300"
                        )}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </Section>
    );
}
