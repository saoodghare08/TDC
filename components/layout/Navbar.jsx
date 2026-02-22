'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { Menu, X, LogIn, User } from 'lucide-react';

const links = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#regimen', label: 'Regimen' },
    { href: '#program', label: 'Our Program' },
    { href: '#reviews', label: 'Reviews' },
    { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Open: Circle expands to fill screen (300% to cover corners on wide screens)
            gsap.to(menuRef.current, {
                clipPath: 'circle(300% at calc(100% - 40px) 40px)',
                duration: 0.8,
                ease: 'power2.inOut'
            });
        } else {
            // Close: Circle shrinks back to top-right button
            gsap.to(menuRef.current, {
                clipPath: 'circle(25px at calc(100% - 40px) 40px)',
                duration: 0.6,
                ease: 'power2.inOut'
            });
        }
    }, [isOpen]);

    const links = [
        { href: '/#home', label: 'Home' },
        { href: '/#about', label: 'About' },
        { href: '/#regimen', label: 'Regimen' },
        { href: '/#program', label: 'Our Program' },
        { href: '/#reviews', label: 'Reviews' },
        { href: '/#contact', label: 'Contact' },
    ];

    return (
        <>
            {/* Client Login — Fixed Top-Left */}
            <Link
                href="/portal/login"
                className=" fixed top-5 left-5 z-10000 flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/25 text-black font-semibold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg text-sm"
                aria-label="Client Login"
            >
                <User size={16} />
                <span className="hidden sm:inline">Client Login</span>
            </Link>

            {/* Toggle Button (Fixed Top-Right) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-5 right-5 z-10000 w-[50px] h-[50px] flex items-center justify-center text-black hover:scale-110 transition-transform hover:cursor-pointer"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Fullscreen Overlay Menu */}
            <nav
                ref={menuRef}
                className="fixed inset-0 w-full h-full bg-white z-9919"
                style={{ clipPath: 'circle(25px at calc(100% - 40px) 40px)' }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
                    <ul className="flex flex-col gap-6">
                        {links.map((link) => (
                            <li key={link.label}>
                                <Link
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="inline-block px-8 py-2 text-2xl md:text-3xl font-medium text-black rounded-full transition-all duration-300 relative group overflow-hidden"
                                >
                                    <span className="relative z-10">{link.label}</span>
                                    {/* Hover Effect: Scale Y from 0 to 1 */}
                                    <span className="absolute inset-0 bg-black z-0 scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-300 ease-out" />
                                    <span className="absolute inset-0 z-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                        {link.label}
                                    </span>
                                </Link>
                            </li>
                        ))}

                        {/* Client Portal CTA */}
                        <li>
                            <Link
                                href="/portal/login"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-3 px-8 py-3 bg-primary text-black text-xl md:text-2xl font-bold rounded-full hover:bg-primary-dark transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <LogIn size={22} />
                                Client Portal
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </>
    );
}
