'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import data from '@/data/content.json';
import Image from 'next/image';

export default function Hero() {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const imageRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            // 1. Initial Load: Simple fade scale for background
            // Start slightly scaled up so we have room to parallax
            tl.fromTo(imageRef.current,
                { scale: 1.2, filter: 'blur(10px)' },
                { scale: 1.1, filter: 'blur(0px)', duration: 1.5, ease: 'power2.out' }
            );

            // 2. Text Reveal
            tl.fromTo(contentRef.current.children,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out' },
                '-=1'
            );

            // 3. Button Reveal (Separate to avoid conflict)
            tl.fromTo(buttonRef.current,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)', clearProps: 'transform' }, // clearProps ensures CSS hover works
                '-=0.5'
            );

            // 4. Parallax Scroll Effect
            gsap.to(imageRef.current, {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                },
                yPercent: 30, // Move image down slightly slower than scroll
                ease: 'none'
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="home" ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center text-white">
            {/* Background Image Wrapper */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/40 z-10" /> {/* Overlay */}
                <div ref={imageRef} className="relative w-full h-[120%] -mt-[10%]"> {/* Extra height for parallax */}
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
                    className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full overflow-hidden transition-all hover:bg-white/20 hover:scale-105 active:scale-95 cursor-pointer"
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
