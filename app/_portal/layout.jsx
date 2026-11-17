'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { LogOut, LayoutDashboard, FileText, TrendingUp, Home } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

export default function PortalLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/portal/login');
        router.refresh();
    };

    const navItems = [
        { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/portal/plans', label: 'Plans', icon: FileText },
        { href: '/portal/progress', label: 'Progress', icon: TrendingUp },
    ];

    return (
        <main className="min-h-screen bg-surface flex flex-col">
            {/* Top Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
                    <Link href="/portal/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 bg-heading rounded-lg flex items-center justify-center text-white transition-transform group-active:scale-95">
                            <span className="font-heading font-black text-sm">T</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-0.5">Portal</span>
                            <span className="text-sm font-bold text-heading leading-none hidden sm:block">The Diet Cascade</span>
                        </div>
                    </Link>

                    {isLoggedIn && (
                        <div className="flex items-center gap-2 md:gap-8">
                            {/* Desktop Nav */}
                            <div className="hidden md:flex items-center gap-8">
                                {navItems.map(({ href, label, icon: Icon }) => {
                                    const isActive = pathname === href;
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            className={clsx(
                                                "flex items-center gap-2 text-sm font-bold tracking-wide transition-all duration-200 uppercase",
                                                isActive ? "text-primary" : "text-para hover:text-heading"
                                            )}
                                        >
                                            <Icon size={16} />
                                            {label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="h-6 w-px bg-gray-100 hidden md:block" />

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-para hover:text-red-500 transition-colors duration-200 font-bold text-[10px] md:text-sm uppercase tracking-wider cursor-pointer py-2 px-3 hover:bg-red-50 rounded-xl"
                            >
                                <LogOut size={16} />
                                <span className="hidden md:inline">Logout</span>
                            </button>
                            
                            <Link href="/" className="p-2 md:p-2.5 bg-surface text-para hover:text-primary transition-colors rounded-xl md:ml-2" title="Back to main site">
                                <Home size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Content Area */}
            <div className="flex-1 pb-24 md:pb-0">
                {children}
            </div>

            {/* Mobile Bottom Navigation (only when logged in) */}
            {isLoggedIn && (
                <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm h-16 bg-heading shadow-2xl shadow-heading/20 rounded-2xl flex items-center justify-around px-2 z-[60] border border-white/10">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={clsx(
                                    "flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all duration-300 rounded-xl active:scale-90",
                                    isActive ? "text-white" : "text-white/40"
                                )}
                            >
                                <Icon size={20} className={clsx("transition-transform", isActive && "scale-110")} />
                                <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}

            <Footer />
        </main>
    );
}
