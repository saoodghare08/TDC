'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';

const StatItem = ({ label, value }) => {
    const activeRef = useRef(null);
    const numericValue = parseInt(value.replace(/,/g, ''), 10); // Handle commas if any
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
                    start: 'top 85%',
                    toggleActions: 'play none none reverse' // Play on enter, reverse on leave up
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
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <h3 ref={activeRef} className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-600 mb-2 font-heading">
                0
            </h3>
            <p className="text-gray-500 font-medium uppercase tracking-wider text-sm">{label}</p>
        </div>
    );
};

export default function Stats() {
    return (
        <Section className="bg-gray-50 -mt-10 md:-mt-20 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {data.about.stats.map((stat, idx) => (
                    <StatItem key={idx} {...stat} />
                ))}
            </div>
        </Section>
    );
}
