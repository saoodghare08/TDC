'use client';

import { useState, useRef, useEffect } from 'react';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import { Check, Leaf, TrendingUp, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const PLAN_ICONS = { Leaf, TrendingUp, Trophy };

export default function Pricing() {
    const router = useRouter();
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(2);

    useEffect(() => {
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
            <div className="absolute top-0 right-0 p-20 bg-blue-100 rounded-full blur-[100px] opacity-30 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-purple-100 rounded-full blur-[120px] opacity-30 pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

            <div className="text-center mb-10 md:mb-16 relative z-10">
                <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Choose Your Plan</span>
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading mb-4">Our Programs</h2>
                <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4 md:px-0">
                    Invest in your health with our structured, expert-led nutrition plans designed for sustainable results.
                </p>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto relative z-10 px-8 md:px-0 overflow-x-auto md:overflow-visible snap-x snap-mandatory pt-6 md:pt-0 pb-8 scrollbar-hide items-stretch"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {data.pricing.map((plan, index) => {
                    const isPopular = index === 1;
                    return (
                        <div
                            key={index}
                            className={clsx(
                                "relative p-6 md:p-8 rounded-4xl flex flex-col min-w-[75vw] md:min-w-0 snap-center",
                                isPopular
                                    ? "bg-white border-2 border-primary shadow-xl md:scale-105 z-20"
                                    : "bg-white border border-gray-100 shadow-lg"
                            )}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-primary to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md whitespace-nowrap">
                                    Most Popular
                                </div>
                            )}

                            {/* Icon + duration pill on one row — eliminates stacked spacing */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    isPopular ? "bg-primary/10 text-primary" : "bg-blue-50 text-blue-700"
                                )}>
                                    {(() => { const Icon = PLAN_ICONS[plan.lucideIcon]; return Icon ? <Icon size={20} strokeWidth={1.75} /> : null; })()}
                                </div>
                                <span className={clsx(
                                    "text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full",
                                    isPopular ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                                )}>
                                    {plan.duration}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold text-heading mb-1.5">{plan.name}</h3>
                            <p className="text-gray-500 text-sm mb-5">{plan.subtitle}</p>

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
                                    "w-full py-4 rounded-xl font-bold transition-transform duration-150 active:scale-[0.97] cursor-pointer",
                                    isPopular
                                        ? "bg-linear-to-r from-primary to-blue-600 text-white shadow-lg"
                                        : "bg-gray-50 border-2 border-gray-200 text-heading shadow-sm"
                                )}
                            >
                                Inquire Now
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="flex md:hidden justify-center items-center gap-3 mt-4 relative z-10">
                {data.pricing.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className={clsx(
                            "transition-all duration-200 rounded-full",
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
