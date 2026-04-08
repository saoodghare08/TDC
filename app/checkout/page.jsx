'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ArrowRight, MessageCircle, User, Phone, Instagram, ClipboardList, ShieldCheck, ChevronLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import data from '@/data/content.json';
import clsx from 'clsx';
import Link from 'next/link';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        instagram: '',
        goals: ''
    });
    const [selectedPlan, setSelectedPlan] = useState(null);

    const planTitle = searchParams.get('plan');
    const regimenTitle = searchParams.get('regimen');

    useEffect(() => {
        if (planTitle) {
            const plan = data.pricing.find(p => p.title === planTitle);
            if (plan) setSelectedPlan({ ...plan, type: 'Pricing Plan' });
        } else if (regimenTitle) {
            const regimen = data.regimens.find(r => r.title === regimenTitle);
            if (regimen) setSelectedPlan({ ...regimen, type: 'Regimen' });
        }
    }, [planTitle, regimenTitle]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleWhatsAppRedirect = (e) => {
        e.preventDefault();

        const itemTitle = selectedPlan?.title || 'a Program';
        const message = `*Order Inquiry - The Diet Cascade*\n\n` +
            `*Plan:* ${itemTitle}\n` +
            `*Name:* ${formData.name}\n` +
            `*Phone:* ${formData.phone}\n` +
            `*Instagram:* ${formData.instagram || 'N/A'}\n` +
            `*Goals/Comments:* ${formData.goals || 'None'}\n\n` +
            `Hi Dt. Sabah, I'm interested in the ${itemTitle}. Please let me know the next steps!`;

        const waUrl = `https://wa.me/+919004491160?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <main className="min-h-screen bg-surface flex flex-col">
            <Navbar />

            <Section className="pt-32 pb-20 px-4 md:px-0 mt-4 md:mt-10">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 md:gap-14">
                    {/* Left Side: Summary Card */}
                    <div className="lg:w-5/12 space-y-6 md:space-y-8 order-2 lg:order-1">
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-heading/5 border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex items-center gap-2 mb-6">
                                <Link href="/" className="p-2 bg-surface rounded-full text-heading hover:text-primary transition-colors">
                                    <ChevronLeft size={18} />
                                </Link>
                                <span className="text-primary font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">Selected Program</span>
                            </div>

                            <h2 className="text-2xl md:text-4xl font-heading font-bold text-heading mb-6 md:mb-8 leading-tight">
                                {selectedPlan?.title || 'Personalized Weight Plan'}
                            </h2>

                            <div className="space-y-4 mb-8 md:mb-10">
                                {selectedPlan?.features ? (
                                    selectedPlan.features.map((feature, i) => (
                                        <div key={i} className="flex gap-3.5 text-para items-start">
                                            <div className="mt-1 p-0.5 rounded-full bg-primary/10 shrink-0">
                                                <Check className="text-primary w-3.5 h-3.5" strokeWidth={3} />
                                            </div>
                                            <span className="text-sm md:text-base font-medium leading-relaxed">{feature}</span>
                                        </div>
                                    ))
                                ) : (
                                    selectedPlan?.description?.map((point, i) => (
                                        <div key={i} className="flex gap-3.5 text-para items-start">
                                            <div className="mt-1 p-0.5 rounded-full bg-primary/10 shrink-0">
                                                <Check className="text-primary w-3.5 h-3.5" strokeWidth={3} />
                                            </div>
                                            <span className="text-sm md:text-base font-medium leading-relaxed">{point.replace(/^\d+\.\s*/, '')}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-5 bg-surface rounded-2xl flex items-center gap-4 text-[10px] md:text-xs text-para italic border border-gray-50">
                                <ShieldCheck className="text-primary shrink-0" size={20} />
                                Direct verification with Dt. Sabah via WhatsApp ensures a legitimate and customized experience.
                            </div>
                        </div>

                        {/* Trust Badges - Mobile Optimized */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3">
                                    <MessageCircle size={20} />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-para/40 mb-1">Direct Line</p>
                                <p className="text-xs font-bold text-heading leading-tight">1-on-1<br />Expert Support</p>
                            </div>
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center text-accent-dark mb-3">
                                    <ClipboardList size={20} />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-para/40 mb-1">Customized</p>
                                <p className="text-xs font-bold text-heading leading-tight">Tailored<br />Nutritional Care</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="lg:w-7/12 order-1 lg:order-2">
                        <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-heading/5 border border-gray-100 relative">
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-5xl font-heading font-bold text-heading mb-3">Initiate Journey</h1>
                                <p className="text-para text-sm md:text-base max-w-sm">Provide your details to connect directly with our clinic experts.</p>
                            </div>

                            <form onSubmit={handleWhatsAppRedirect} className="space-y-6 md:space-y-7">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-heading uppercase tracking-wider ml-1 flex items-center gap-2">
                                            <User size={16} className="text-primary" /> Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Your name"
                                            className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm md:text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-heading uppercase tracking-wider ml-1 flex items-center gap-2">
                                            <Phone size={16} className="text-primary" /> Phone / WA
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            placeholder="+91 00000 00000"
                                            className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm md:text-base"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-heading uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Instagram size={16} className="text-primary" /> Instagram (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleChange}
                                        placeholder="@handle"
                                        className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm md:text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-heading uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <ClipboardList size={16} className="text-primary" /> Health Goals
                                    </label>
                                    <textarea
                                        name="goals"
                                        value={formData.goals}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Briefly describe what you'd like to achieve..."
                                        className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all resize-none text-sm md:text-base leading-relaxed"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all duration-150 active:scale-[0.97] hover:bg-primary-hover flex items-center justify-center gap-3 text-base md:text-lg group cursor-pointer"
                                    >
                                        Connect via WhatsApp
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </button>
                                    <p className="text-center text-[10px] md:text-xs text-para italic mt-5">
                                        Dt. Sabah will reach out to you within 24-48 working hours.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </Section>

            <div className="mt-auto">
                <Footer />
            </div>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-para text-sm font-medium animate-pulse">Initializing Checkout...</p>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
