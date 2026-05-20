import { getSeoMetadata } from '@/utils/getSeoMetadata';
export const revalidate = 518400; // 6 days
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import data from '@/data/content.json';
import Link from 'next/link';
import {
    MessageSquare, ClipboardList, Utensils, PhoneCall,
    MessageCircle, Layers, Dumbbell, TrendingUp,
    Map, ShieldCheck, BookOpen, ArrowRight, CheckCircle2, Search
} from 'lucide-react';

export async function generateMetadata() {
    return getSeoMetadata('/program', {
        title: 'Our Programme | The Diet Cascade',
        description: 'Discover the TDC service suite — from customised diet plans and blood report analysis to workout guidance, meal tracking, and progress monitoring calls.',
        keywords: 'tdc programme, diet programme, diet services, meal plans, progress monitoring, dt sabah ghare programme',
    });
}

const iconMap = [
    { keywords: ['counseling'], icon: MessageSquare },
    { keywords: ['clinical', 'anthropometric'], icon: ClipboardList },
    { keywords: ['customized'], icon: Utensils },
    { keywords: ['follow up'], icon: PhoneCall },
    { keywords: ['whatsapp'], icon: MessageCircle },
    { keywords: ['periodisation'], icon: Layers },
    { keywords: ['workout'], icon: Dumbbell },
    { keywords: ['progress', 'tracking'], icon: TrendingUp },
    { keywords: ['travel'], icon: Map },
    { keywords: ['maintenance'], icon: ShieldCheck },
    { keywords: ['nutritional', 'guidance'], icon: BookOpen },
    { keywords: ['diet recall'], icon: Search },
];

function getIcon(text) {
    const lower = text.toLowerCase();
    const match = iconMap.find(item => item.keywords.some(kw => lower.includes(kw)));
    return match ? match.icon : ShieldCheck;
}

export default async function ProgramPage() {
    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            <Navbar />

            {/* Hero Banner */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
                <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
                        Comprehensive Care
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Our <span className="text-primary">Programme</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        An end-to-end service experience that goes far beyond meal plans — covering clinical records, progress monitoring, workout guidance, and more.
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            <Section id="services-list" className="bg-surface">
                <div className="text-center mb-12 md:mb-16">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">What's Included</span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">Efficient Service Suite</h2>
                    <p className="text-para text-base mt-4 max-w-xl mx-auto">Every service is included in your plan — no hidden add-ons.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {data.services.map((service, index) => {
                        const Icon = getIcon(service);
                        return (
                            <div key={index} className="group bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 flex items-start gap-5 shadow-sm hover:shadow-xl hover:shadow-heading/5 transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                                    <Icon size={20} className="text-primary group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-heading text-sm md:text-base leading-snug">{service}</p>
                                    <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold mt-2">
                                        <CheckCircle2 size={12} /> Included in all plans
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* Pricing Plans */}
            <Section id="plans" className="bg-white">
                <div className="text-center mb-12 md:mb-16">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Choose Your Duration</span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">Flexible Plan Durations</h2>
                    <p className="text-para text-base mt-4 max-w-xl mx-auto">Select the duration that suits your goals. Every plan includes the full service suite.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
                    {data.pricing.map((plan, index) => {
                        const isFeatured = index === 1;
                        return (
                            <div key={index} className={`rounded-[2.5rem] p-8 md:p-10 flex flex-col relative overflow-hidden transition-all duration-300 ${isFeatured ? 'bg-heading text-white shadow-2xl shadow-heading/20 scale-[1.02]' : 'bg-surface border border-gray-150 shadow-sm hover:shadow-lg'}`}>
                                {isFeatured && (
                                    <div className="absolute top-5 right-5 bg-accent text-heading text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                        Most Popular
                                    </div>
                                )}
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black font-heading mb-6 ${isFeatured ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                                    {plan.icon}
                                </div>
                                <h3 className={`text-2xl font-heading font-bold mb-6 ${isFeatured ? 'text-white' : 'text-heading'}`}>{plan.title}</h3>
                                <ul className="space-y-3 flex-1 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className={`flex items-start gap-3 text-sm ${isFeatured ? 'text-white/80' : 'text-para'}`}>
                                            <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${isFeatured ? 'text-primary' : 'text-primary'}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={`/checkout?plan=${encodeURIComponent(plan.title)}`}
                                    className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 duration-150 ${isFeatured ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover' : 'bg-heading text-white hover:bg-heading/90'}`}
                                >
                                    Choose Plan <ArrowRight size={16} />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* Perfect Match */}
            <Section id="perfect-match" className="bg-surface">
                <div className="text-center mb-12">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Is TDC Right For You?</span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">The Perfect Match</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                    {data.perfectMatch.map((item, index) => (
                        <div key={index} className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 flex items-start gap-4 shadow-sm">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 size={16} className="text-primary" />
                            </div>
                            <p className="text-para text-sm md:text-base leading-relaxed">{item}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <Footer />
        </main>
    );
}
