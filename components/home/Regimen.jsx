'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRight } from 'lucide-react';
import data from '@/data/content.json';
import Image from 'next/image';
import clsx from 'clsx';

export default function Regimen() {
    const router = useRouter();
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section id="regimen" className="py-16 md:py-28 bg-white">
            <div className="container mx-auto px-6 md:px-12 max-w-5xl">
                {/* Header */}
                <div className="mb-10 md:mb-14 text-center md:text-left">
                    <span className="text-primary font-semibold tracking-[0.2em] uppercase text-[11px] md:text-xs block mb-3">
                        Our Regimens
                    </span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">
                        What We Offer
                    </h2>
                    <p className="text-para mt-3 max-w-lg md:mx-0 mx-auto text-sm md:text-base">
                        Comprehensive health and wellness regimens tailored for you.
                    </p>
                </div>

                {/* Accordion */}
                <div className="space-y-3">
                    {data.regimens.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className={clsx(
                                    'rounded-2xl border overflow-hidden transition-colors duration-200',
                                    isOpen
                                        ? 'border-primary/20 bg-primary-50'
                                        : 'border-gray-100 bg-white'
                                )}
                            >
                                {/* Panel header */}
                                <button
                                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                    className="w-full flex items-center justify-between gap-4 p-4 md:p-6 text-left cursor-pointer transition-transform duration-150 active:scale-[0.995]"
                                >
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                        <div
                                            className={clsx(
                                                'relative w-11 h-11 md:w-14 md:h-14 rounded-xl overflow-hidden shrink-0 transition-all duration-300',
                                                isOpen && 'w-0 h-0 opacity-0'
                                            )}
                                        >
                                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                                        </div>
                                        <h3
                                            className={clsx(
                                                'font-heading font-bold text-sm md:text-lg transition-colors duration-200 truncate',
                                                isOpen ? 'text-primary' : 'text-heading'
                                            )}
                                        >
                                            {item.title}
                                        </h3>
                                    </div>
                                    <ChevronDown
                                        className={clsx(
                                            'shrink-0 text-para transition-transform duration-300',
                                            isOpen && 'rotate-180 text-primary'
                                        )}
                                        style={{ transitionTimingFunction: 'var(--ease-out)' }}
                                        size={20}
                                    />
                                </button>

                                {/* Expandable content — grid-row trick for smooth height */}
                                <div
                                    className="grid transition-[grid-template-rows] duration-500"
                                    style={{
                                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                                        transitionTimingFunction: 'var(--ease-out)',
                                    }}
                                >
                                    <div className="overflow-hidden">
                                        <div className="px-4 pb-5 md:px-6 md:pb-8">
                                            <div className="flex flex-col md:flex-row gap-5 md:gap-8">
                                                {/* Image */}
                                                <div className="relative w-full md:w-60 lg:w-72 h-44 md:h-48 rounded-xl overflow-hidden shrink-0">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                {/* Description */}
                                                <div className="flex-1 space-y-3">
                                                    <ul className="space-y-2.5">
                                                        {item.description.map((point, i) => (
                                                            <li
                                                                key={i}
                                                                className="flex gap-2.5 text-para text-sm leading-relaxed"
                                                                style={{
                                                                    opacity: isOpen ? 1 : 0,
                                                                    transform: isOpen ? 'translateY(0)' : 'translateY(8px)',
                                                                    transition: `opacity 400ms var(--ease-out) ${i * 50}ms, transform 400ms var(--ease-out) ${i * 50}ms`,
                                                                }}
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-[7px] shrink-0" />
                                                                <span>{point.replace(/^\d+\.\s*/, '')}</span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <button
                                                        className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-heading text-white text-sm rounded-xl font-semibold cursor-pointer transition-all duration-150 active:scale-[0.97]"
                                                        style={{ transitionTimingFunction: 'var(--ease-out)' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/checkout?regimen=${encodeURIComponent(item.title)}`);
                                                        }}
                                                    >
                                                        Enroll Now
                                                        <ArrowRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
