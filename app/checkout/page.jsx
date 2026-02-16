'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ArrowRight, MessageCircle, User, Phone, Instagram, ClipboardList, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import data from '@/data/content.json';
import clsx from 'clsx';
import gsap from 'gsap';

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

    if (!selectedPlan && (planTitle || regimenTitle)) {
        // Still loading or not found
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <Section className="pt-32 pb-20 px-4 md:px-0">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
                    {/* Left Side: Summary */}
                    <div className="lg:w-5/12 space-y-8 order-2 lg:order-1">
                        <div className="bg-white p-8 rounded-4xl shadow-xl border border-gray-100 relative overflow-hidden group">
                            {/* Decorative blur */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl transition-all group-hover:bg-primary/10" />

                            <span className="text-primary font-bold text-xs uppercase tracking-widest mb-4 block">Selected Plan</span>
                            <h2 className="text-3xl font-heading font-bold text-heading mb-6">
                                {selectedPlan?.title || 'Custom Growth Plan'}
                            </h2>

                            <div className="space-y-4 mb-8">
                                {selectedPlan?.features ? (
                                    selectedPlan.features.map((feature, i) => (
                                        <div key={i} className="flex gap-3 text-gray-600">
                                            <div className="mt-1 p-0.5 rounded-full bg-green-100 shrink-0 h-5 w-5 flex items-center justify-center">
                                                <Check className="text-green-600 w-3 h-3" strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-medium">{feature}</span>
                                        </div>
                                    ))
                                ) : (
                                    selectedPlan?.description?.map((point, i) => (
                                        <div key={i} className="flex gap-3 text-gray-600">
                                            <div className="mt-1 p-0.5 rounded-full bg-primary/10 shrink-0 h-5 w-5 flex items-center justify-center">
                                                <Check className="text-primary w-3 h-3" strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-medium">{point.replace(/^\d+\.\s*/, '')}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 text-xs text-gray-500 italic">
                                <ShieldCheck className="text-primary" size={18} />
                                Your details are shared securely via WhatsApp for a personalized consultation.
                            </div>
                        </div>

                        {/* Why Us? */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-3">
                                    <MessageCircle size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 mb-1">Support</span>
                                <span className="text-xs font-bold text-heading leading-tight">1-on-1<br />Coaching</span>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-3">
                                    <ClipboardList size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 mb-1">Tailored</span>
                                <span className="text-xs font-bold text-heading leading-tight">Personalized<br />Diet Plans</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="lg:w-7/12 order-1 lg:order-2">
                        <div className="bg-white p-8 md:p-12 rounded-4xl shadow-2xl border border-gray-100 relative z-10">
                            <h1 className="text-4xl font-heading font-bold text-heading mb-2">Checkout</h1>
                            <p className="text-gray-500 mb-10">Please provide your details to initiate your journey with us.</p>

                            <form onSubmit={handleWhatsAppRedirect} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                                            <User size={16} className="text-primary" /> Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your full name"
                                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-heading flex items-center gap-2">
                                            <Phone size={16} className="text-primary" /> Phone / WhatsApp
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            placeholder="+91 00000 00000"
                                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-heading flex items-center gap-2">
                                        <Instagram size={16} className="text-primary" /> Instagram ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleChange}
                                        placeholder="@yourhandle"
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-heading flex items-center gap-2">
                                        <ClipboardList size={16} className="text-primary" /> Your Health Goals / Comments
                                    </label>
                                    <textarea
                                        name="goals"
                                        value={formData.goals}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Briefly describe what you'd like to achieve..."
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-linear-to-r from-primary to-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg group cursor-pointer"
                                >
                                    Proceed to WhatsApp
                                    <MessageCircle className="w-6 h-6 animate-pulse" />
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </button>

                                <p className="text-center text-xs text-gray-400">
                                    Clicking the button will open WhatsApp with your details pre-filled.
                                </p>
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
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
