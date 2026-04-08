'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import data from '@/data/content.json';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const imageRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            // Background reveal — start from scale(1.1), not 1.2 to reduce paint area
            tl.fromTo(imageRef.current,
                { scale: 1.1, opacity: 0.8 },
                { scale: 1.05, opacity: 1, duration: 1.2, ease: 'power2.out' }
            );

            // Text stagger — reduced duration, tighter stagger
            tl.fromTo(contentRef.current.children,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
                '-=0.8'
            );

            // Button — start from scale(0.95) not 0.8 (never animate from too small)
            tl.fromTo(buttonRef.current,
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'transform' },
                '-=0.3'
            );

            // Parallax — only animate transform (GPU-composited)
            gsap.to(imageRef.current, {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                },
                yPercent: 20,
                ease: 'none'
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="home" ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center text-white">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div ref={imageRef} className="relative w-full h-[115%] -mt-[8%] will-change-transform">
                    <Image
                        src={data.hero.media}
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
                <div ref={contentRef} className="flex flex-col items-center">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-4 tracking-tighter text-white drop-shadow-lg">
                        {data.hero.title}
                    </h1>

                    <div className="w-24 h-1 bg-primary rounded-full mb-6 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>

                    <p className="text-2xl md:text-4xl font-light text-gray-100 mb-2 font-heading">
                        {data.hero.subtitle}
                    </p>

                    <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-primary-200 mb-8">
                        {data.hero.role}
                    </p>
                </div>

                <button
                    ref={buttonRef}
                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full overflow-hidden transition-transform duration-150 active:scale-[0.97] cursor-pointer"
                >
                    <div className="absolute inset-0 w-full h-full bg-linear-to-r from-primary/0 via-primary/30 to-primary/0 -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative font-bold tracking-wide">EXPLORE MORE</span>
                </button>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce opacity-70">
                <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-white rounded-full animate-scroll"></div>
                </div>
            </div>
        </section>
    );
}
