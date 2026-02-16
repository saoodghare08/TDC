'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, MessageSquareQuote, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
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
        // Clear the session expiry cookie
        document.cookie = "admin_session_expiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Image src="/images/logo.png" width={32} height={32} alt="Logo" className="object-contain" />
                    <span className="font-bold font-heading text-lg">Admin Panel</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/images/logo.png" width={40} height={40} alt="Logo" className="object-contain" />
                        <span className="font-bold font-heading text-lg">Admin Panel</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)} // Close on navigate
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                                    isActive
                                        ? "bg-primary text-black shadow-lg shadow-primary/20"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-heading"
                                )}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
                {children}
            </main>
        </div>
    );
}
