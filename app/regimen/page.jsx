import { getSeoMetadata } from '@/utils/getSeoMetadata';
export const revalidate = 518400; // 6 days
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import data from '@/data/content.json';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Regimen from '@/components/home/Regimen';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';

export async function generateMetadata() {
    return getSeoMetadata('/regimen', {
        title: 'Our Regimens | The Diet Cascade',
        description: 'Explore our specialised diet regimens — from body transformation to PCOS management, gestational diets, and therapeutic nutrition. Personalised by Dt. Sabah Ghare.',
        keywords: 'diet regimens, body transformation diet, pcos diet plan, weight loss programme, gestational diet, therapeutic diet cascade',
    });
}

export default async function RegimenPage() {
    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            <BreadcrumbSchema items={[
                { name: 'Home', url: '/' },
                { name: 'Diet Regimens', url: '/regimen' },
            ]} />
            <Navbar />

            {/* Hero Banner */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
                <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
                        Tailored For You
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Our <span className="text-primary">Diet Regimens</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        Every body is unique. Our clinically guided regimens are designed around your goals, preferences, and lifestyle — not the other way around.
                    </p>
                </div>
            </div>

            {/* Regimens Grid */}
            <Regimen />

            {/* Diet Perspective */}
            <Section id="diet-perspective" className="bg-white">
                <div className="max-w-4xl mx-auto bg-heading rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
                    <div className="relative z-10">
                        <span className="text-primary text-xs font-bold uppercase tracking-wider mb-4 block">The Philosophy</span>
                        <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-6">{data.dietPerspective.title}</h2>
                        <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-3xl mx-auto">{data.dietPerspective.text}</p>
                        <blockquote className="text-primary text-xl md:text-2xl font-heading font-bold italic">"{data.dietPerspective.quote}"</blockquote>
                    </div>
                </div>
            </Section>

            {/* CTA */}
            <Section id="regimen-cta" className="bg-surface">
                <div className="text-center max-w-2xl mx-auto">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Next Step</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">Not Sure Which Regimen to Choose?</h2>
                    <p className="text-para text-base mb-8">Browse our FAQs or get in touch with Dt. Sabah directly. We'll help you find the perfect plan.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/checkout" className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 duration-150 inline-flex items-center gap-2">
                            Get Started <ArrowRight size={18} />
                        </Link>
                        <Link href="/faq" className="px-8 py-4 bg-white border border-gray-200 hover:border-primary/30 text-heading font-bold rounded-2xl transition-all active:scale-95 duration-150">
                            Read FAQs
                        </Link>
                    </div>
                </div>
            </Section>

            <Footer />
        </main>
    );
}
