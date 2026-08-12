'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/utils/gsap';
import data from '@/data/content.json';
import Image from 'next/image';
import Link from 'next/link';

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
                {/* Layered gradient overlay: dark base + green tint at bottom for brand */}
                <div className="absolute inset-0 bg-black/50 z-10" />
                <div className="absolute inset-0 bg-linear-to-t from-primary/30 via-transparent to-transparent z-10" />
                <div ref={imageRef} className="relative w-full h-[115%] -mt-[8%] will-change-transform">
                    <Image
                        src={data.hero.media}
                        alt="Healthy lifestyle consultation at The Diet Cascade clinic"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
                <div ref={contentRef} className="flex flex-col items-center">

                    {/* Credential badge — establishes trust before the headline */}
                    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-8">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-white/90">
                            {data.hero.subtitle} &mdash; {data.hero.role}
                        </span>
                    </div>

                    {/* Benefit-first H1 */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 tracking-tighter text-white drop-shadow-lg leading-[1.05]">
                        {data.hero.title}
                    </h1>

                    {/* Supporting tagline */}
                    <p className="text-lg md:text-2xl font-light text-white/75 mb-10 max-w-2xl leading-relaxed">
                        {data.hero.tagline}
                    </p>

                    {/* Divider accent */}
                    <div className="w-16 h-0.5 bg-primary rounded-full mb-10 shadow-[0_0_20px_rgba(45,106,79,0.8)]" />
                </div>

                {/* Dual CTA */}
                <div ref={buttonRef} className="flex flex-col sm:flex-row items-center gap-4">
                    <Link
                        href="/checkout"
                        className="group relative px-8 py-4 bg-primary text-white font-bold rounded-full shadow-2xl shadow-primary/40 overflow-hidden transition-transform duration-150 active:scale-[0.97] hover:bg-primary-hover"
                    >
                        Book a Consultation
                    </Link>
                    <button
                        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full overflow-hidden transition-transform duration-150 active:scale-[0.97] cursor-pointer"
                    >
                        <div className="absolute inset-0 w-full h-full bg-linear-to-r from-primary/0 via-primary/30 to-primary/0 -translate-x-full group-hover:animate-shimmer" />
                        <span className="relative tracking-wide">Explore More</span>
                    </button>
                </div>
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
