'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ClientLoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push('/portal/dashboard');
            }
        };
        checkUser();
    }, [router, supabase]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                router.push('/portal/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('Something went wrong. Please check your connection.');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="max-w-md w-full relative z-10">
                {/* Branding */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block group mb-6">
                        <div className="flex items-center gap-2 text-para text-xs font-bold uppercase tracking-widest group-hover:text-primary transition-colors">
                            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                            Homepage
                        </div>
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-heading font-bold text-heading mb-2 leading-tight">
                        Client <span className="text-primary italic">Portal</span>
                    </h1>
                    <p className="text-para text-sm font-medium">Monitoring your health journey, together.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-heading/5 border border-gray-100 relative">
                    <div className="mb-8">
                        <h2 className="text-xl md:text-2xl font-bold text-heading mb-1">Welcome back</h2>
                        <p className="text-para text-xs md:text-sm">Please enter your credentials to continue</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-heading uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Mail size={14} className="text-primary" /> Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="your@email.com"
                                className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-heading uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Lock size={14} className="text-primary" /> Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm pr-12"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-para/40 hover:text-primary transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-heading text-white font-bold rounded-2xl transition-all duration-150 active:scale-[0.97] shadow-xl shadow-heading/10 flex items-center justify-center gap-3 text-sm md:text-base group disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Access Dashboard
                                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-para">
                            Issues with logging in?{' '}
                            <a
                                href="https://wa.me/+918452095252"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-bold transition-colors hover:text-primary-hover underline underline-offset-4"
                            >
                                Contact Clinic Admin
                            </a>
                        </p>
                    </div>
                </div>

                <p className="mt-10 text-center text-[10px] text-para/50 uppercase tracking-[0.3em]">
                    The Diet Cascade
                </p>
            </div>
        </main>
    );
}
