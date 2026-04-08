'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';

gsap.registerPlugin(ScrollTrigger);

const StatItem = ({ label, value }) => {
    const activeRef = useRef(null);
    const numericValue = parseInt(value.replace(/,/g, ''), 10);
    const suffix = value.replace(/[0-9,]/g, '');

    useEffect(() => {
        const ctx = gsap.context(() => {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: numericValue,
                duration: 2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: activeRef.current,
                    start: 'top 100%',
                    toggleActions: 'play none none reverse'
                },
                onUpdate: () => {
                    if (activeRef.current) {
                        activeRef.current.innerText = Math.floor(obj.val).toLocaleString() + suffix;
                    }
                }
            });
        }, activeRef);
        return () => ctx.revert();
    }, [numericValue, suffix]);

    return (
        <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-100 transition-transform duration-200 hover:-translate-y-1">
            <h3 ref={activeRef} className="text-3xl md:text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-600 mb-1 md:mb-2 font-heading">
                0
            </h3>
            <p className="text-gray-500 font-medium uppercase tracking-wider text-xs md:text-sm">{label}</p>
        </div>
    );
};

export default function Stats() {
    return (
        <Section className="bg-gray-50 -mt-10 md:-mt-20 relative z-10 !py-10 md:!py-32">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
                {data.about.stats.map((stat, idx) => (
                    <StatItem key={idx} {...stat} />
                ))}
            </div>
        </Section>
    );
}
