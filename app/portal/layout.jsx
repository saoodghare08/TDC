'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { LogOut, LayoutDashboard, FileText, TrendingUp } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PortalLayout({ children }) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check initial session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkSession();

        // Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/portal/login');
        router.refresh();
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* Portal Navigation */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/portal/dashboard" className="flex items-center gap-3">
                        <h1 className="text-2xl font-heading font-bold text-heading">
                            The Diet Cascade
                        </h1>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            Client Portal
                        </span>
                    </Link>

                    {isLoggedIn && (
                        <div className="flex items-center gap-6">
                            <Link
                                href="/portal/dashboard"
                                className="flex items-center gap-2 text-gray-600 hover:text-primary transition font-medium"
                            >
                                <LayoutDashboard size={20} />
                                <span className="hidden md:inline">Dashboard</span>
                            </Link>
                            <Link
                                href="/portal/plans"
                                className="flex items-center gap-2 text-gray-600 hover:text-primary transition font-medium"
                            >
                                <FileText size={20} />
                                <span className="hidden md:inline">Diet Plans</span>
                            </Link>
                            <Link
                                href="/portal/progress"
                                className="flex items-center gap-2 text-gray-600 hover:text-primary transition font-medium"
                            >
                                <TrendingUp size={20} />
                                <span className="hidden md:inline">Progress</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition font-medium cursor-pointer"
                            >
                                <LogOut size={20} />
                                <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Content */}
            <div className="flex-1">
                {children}
            </div>

            {/* Footer */}
            <Footer />
        </main>
    );
}
