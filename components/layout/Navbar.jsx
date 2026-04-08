'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { Menu, X } from 'lucide-react';

const navLinks = [
    { href: '/#home', label: 'Home' },
    { href: '/#about', label: 'About' },
    { href: '/#regimen', label: 'Regimen' },
    { href: '/#program', label: 'Our Program' },
    { href: '/#reviews', label: 'Reviews' },
    { href: '/#contact', label: 'Contact' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const linksRef = useRef([]);

    useEffect(() => {
        const buttonCenter = 'calc(100% - 45px) 45px';
        
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            
            const tl = gsap.timeline();
            
            // Expand menu circle
            tl.to(menuRef.current, {
                clipPath: `circle(300% at ${buttonCenter})`,
                duration: 0.8,
                ease: 'power4.inOut'
            });

            // Stagger reveal links
            tl.fromTo(linksRef.current.filter(Boolean), 
                { y: 60, opacity: 0, rotateX: -45 },
                { 
                    y: 0, 
                    opacity: 1, 
                    rotateX: 0,
                    duration: 0.8, 
                    stagger: 0.08, 
                    ease: 'power3.out' 
                },
                '-=0.4'
            );
        } else {
            document.body.style.overflow = '';
            
            // Reset links
            gsap.to(linksRef.current.filter(Boolean), {
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in'
            });

            gsap.to(menuRef.current, {
                clipPath: `circle(25px at ${buttonCenter})`,
                duration: 0.6,
                ease: 'power4.inOut'
            });
        }
    }, [isOpen]);

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-5 right-5 z-10000 w-[50px] h-[50px] flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-all duration-300 hover:cursor-pointer"
                aria-label="Toggle Menu"
            >
                <div className="relative w-7 h-7 flex items-center justify-center">
                    <Menu 
                        size={28} 
                        className={`absolute transition-all duration-500 ease-in-out ${isOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} 
                    />
                    <X 
                        size={28} 
                        className={`absolute transition-all duration-500 ease-in-out ${isOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} 
                    />
                </div>
            </button>

            {/* Fullscreen Overlay Menu */}
            <nav
                ref={menuRef}
                className="fixed inset-0 w-full h-full bg-white z-9919 flex flex-col items-center justify-center overflow-hidden"
                style={{ clipPath: 'circle(25px at calc(100% - 45px) 45px)' }}
            >
                <div className="w-full max-w-2xl px-6 text-center">
                    <ul className="flex flex-col gap-4 md:gap-6 perspective-1000">
                        {navLinks.map((link, index) => (
                            <li 
                                key={link.label}
                                ref={el => linksRef.current[index] = el}
                                className="origin-top"
                            >
                                <Link
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="group relative inline-block px-10 py-3 text-3xl md:text-5xl font-heading font-bold text-heading hover:text-primary transition-colors duration-300"
                                >
                                    <span className="relative z-10">{link.label}</span>
                                    <span className="absolute left-0 bottom-2 w-0 h-2 bg-primary/20 transition-all duration-500 group-hover:w-full" />
                                </Link>
                            </li>
                        ))}

                        {/* Client Portal CTA */}
                        <li ref={el => linksRef.current[navLinks.length] = el}>
                            <Link
                                href="/portal/login"
                                onClick={() => setIsOpen(false)}
                                className="mt-8 inline-flex items-center gap-3 px-10 py-4 bg-primary text-black text-xl md:text-2xl font-bold rounded-full hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20"
                            >
                                Client Portal
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Decorative background number/letter? Or just keep it clean */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center">
                    <span className="text-[40vw] font-black uppercase tracking-tighter">TDC</span>
                </div>
            </nav>
        </>
    );
}
