'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, MessageSquareQuote, FileText, Settings, LogOut, Menu, X, Users, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
    { href: '/admin/blog', label: 'Blog', icon: FileText },
    { href: '/admin/seo', label: 'SEO', icon: Settings },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        document.cookie = "admin_session_expiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/admin/login');
        router.refresh();
    };

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-gray-50">

            {/* ── Mobile top bar ───────────────────────────────────── */}
            <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <Image src="/images/logo.png" width={28} height={28} alt="Logo" className="object-contain" />
                    <span className="font-bold font-heading text-base text-heading">Admin Panel</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    aria-label="Open menu"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* ── Overlay ──────────────────────────────────────────── */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static shadow-xl md:shadow-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/images/logo.png" width={36} height={36} alt="Logo" className="object-contain" />
                        <div>
                            <span className="font-bold font-heading text-base text-heading block leading-tight">Admin Panel</span>
                            <span className="text-xs text-gray-400">The Diet Cascade</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg md:hidden transition"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm group",
                                    isActive
                                        ? "bg-primary text-black shadow-md shadow-primary/20"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-heading"
                                )}
                            >
                                <Icon size={18} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight size={14} className="opacity-60" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-colors font-medium text-sm"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Main ─────────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto pt-14 md:pt-0 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
