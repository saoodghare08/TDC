'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Send, MapPin, User, Quote, ChevronLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function ShareStoryPage() {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        content: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('reviews').insert([{
            ...formData,
            is_approved: false
        }]);

        if (error) {
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.message,
                confirmButtonColor: '#2d6a4f'
            });
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-surface flex flex-col">
                <Navbar />
                <Section className="grow flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-8 animate-bounce">
                        <Send size={40} />
                    </div>
                    <h1 className="text-4xl font-heading font-bold text-heading mb-4">You're Amazing!</h1>
                    <p className="text-para max-w-md mx-auto mb-10 text-lg leading-relaxed">
                        Your transformation story is in safe hands. Once verified, it will inspire countless others on their wellness journey.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-8 py-4 bg-heading text-white font-bold rounded-2xl transition-transform duration-150 active:scale-[0.97] cursor-pointer"
                    >
                        Back to Home
                    </button>
                </Section>
                <Footer />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-surface">
            <Navbar />

            {/* Header Area */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
                
                <div className="relative z-10 px-6 max-w-3xl mx-auto text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-primary-200 text-xs font-bold uppercase tracking-wider mb-6 hover:text-white transition-colors group">
                        <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                        Back
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Share Your <span className="text-primary-200">Journey</span>
                    </h1>
                    <p className="text-white/60 max-w-xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        Every transformation starts with a story. Inspire the community by sharing yours.
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <Section className="max-w-3xl mx-auto -mt-16 md:-mt-24 relative z-20 px-4 md:px-0 pb-20">
                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-heading/5 border border-gray-100 space-y-8"
                >
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-heading uppercase tracking-wider ml-1">
                                <User size={16} className="text-primary" /> Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm md:text-base"
                                required
                                placeholder="How should we call you?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-heading uppercase tracking-wider ml-1">
                                <MapPin size={16} className="text-primary" /> Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm md:text-base"
                                required
                                placeholder="City, Country"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-heading uppercase tracking-wider ml-1">
                            <Quote size={16} className="text-primary" /> Your Story
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={6}
                            className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all resize-none text-sm md:text-base leading-relaxed"
                            required
                            placeholder="Tell us about your experience..."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-primary text-white font-bold rounded-2xl transition-all duration-150 active:scale-[0.97] shadow-xl shadow-primary/20 hover:bg-primary-hover flex items-center justify-center gap-3 text-base md:text-lg disabled:opacity-50 group cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Submit My Story
                                    <Send size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-center text-[10px] md:text-xs text-para italic mt-6">
                        By submitting, you agree to allow us to share your transformation on our platform.
                    </p>
                </form>
            </Section>

            <Footer />
        </main>
    );
}
