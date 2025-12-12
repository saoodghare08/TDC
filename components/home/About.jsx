'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import data from '@/data/content.json';
import Section from '@/components/ui/Section';
import Image from 'next/image';

export default function About() {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Text Animation
            gsap.from(textRef.current.children, {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 75%',
                    toggleActions: 'play none none reverse'
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out'
            });

            // Image Animation
            gsap.from(imageRef.current, {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 75%',
                },
                scale: 0.9,
                opacity: 0,
                duration: 1,
                ease: 'back.out(1.7)'
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <Section id="about" className="bg-linear-to-b from-white to-gray-50/50" containerClass="relative">
            {/* Decorative Background Text */}
            <div className="absolute top-10 left-0 w-full overflow-hidden opacity-[0.03] pointer-events-none select-none">
                <span className="text-[10rem] md:text-[15rem] font-bold font-heading whitespace-nowrap leading-none block transform -translate-x-10">
                    DIET CASCADE
                </span>
            </div>

            <div ref={containerRef} className="grid md:grid-cols-12 gap-12 items-center relative z-10">
                {/* Content Side (7 columns) */}
                <div ref={textRef} className="md:col-span-7 space-y-8 order-2 md:order-1">
                    <div>
                        <span className="text-primary font-bold tracking-widest uppercase text-sm mb-2 block">Who We Are</span>
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading leading-tight">
                            {data.about.title}
                        </h2>
                        <div className="h-1.5 w-24 bg-linear-to-r from-primary to-transparent rounded-full mt-4"></div>
                    </div>

                    <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                        {data.about.paragraphs.map((p, index) => (
                            <p key={index} className="border-l-4 border-gray-100 pl-4 hover:border-primary/30 transition-colors">
                                {p}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Image Side (5 columns) */}
                <div className="md:col-span-5 order-1 md:order-2 flex justify-center items-center relative">
                    <div ref={imageRef} className="relative w-72 h-72 md:w-96 md:h-96">
                        {/* Blob Background */}
                        <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-purple-200 rounded-full blur-3xl animate-pulse delay-700 transform scale-110"></div>

                        {/* Image Container */}
                        <div className="relative z-10 w-full h-full bg-white rounded-full shadow-2xl p-6 border border-gray-100 flex items-center justify-center">
                            <Image
                                src="/images/logo.png"
                                alt="The Diet Cascade Logo"
                                width={400}
                                height={400}
                                className="object-contain w-full h-full drop-shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
