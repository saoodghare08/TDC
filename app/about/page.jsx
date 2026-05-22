import { getSeoMetadata } from '@/utils/getSeoMetadata';
export const revalidate = 518400; // 6 days
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import data from '@/data/content.json';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, Globe, Users, Heart, Star, BookOpen } from 'lucide-react';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';

export async function generateMetadata() {
    return getSeoMetadata('/about', {
        title: 'About Us | The Diet Cascade',
        description: 'Meet Dt. Sabah Ghare — Clinical Dietitian, Lifestyle Coach, and founder of The Diet Cascade. Learn how we help 5000+ clients across 8+ countries transform their health.',
        keywords: 'about the diet cascade, sabah ghare dietitian, clinical dietitian navi mumbai, holistic health clinic',
    });
}

const milestones = [
    { icon: Users, value: '5000+', label: 'Happy Clients', color: 'text-emerald-600' },
    { icon: Globe, value: '8+', label: 'Countries Served', color: 'text-blue-600' },
    { icon: Award, value: '10000+', label: 'Diet Plans Created', color: 'text-amber-600' },
    { icon: Star, value: '300+', label: 'Transformations', color: 'text-rose-500' },
];

const values = [
    {
        icon: Heart,
        title: 'Personalised Care',
        description: 'Every plan is crafted around your unique preferences, lifestyle, and health goals — no one-size-fits-all templates.'
    },
    {
        icon: BookOpen,
        title: 'Education First',
        description: 'We believe knowledge is power. Understanding your body and nutrition builds lifelong healthy habits.'
    },
    {
        icon: Award,
        title: 'Holistic Approach',
        description: 'Beyond the scale — we address nutrition, fitness, sleep, and mental well-being as a unified whole.'
    },
];

export default function AboutPage() {
    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            <BreadcrumbSchema items={[
                { name: 'Home', url: '/' },
                { name: 'About Us', url: '/about' },
            ]} />
            <Navbar />

            {/* Hero Banner */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
                <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
                        Our Story
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        About <span className="text-primary">The Diet Cascade</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        A holistic health clinic specialising in lifestyle and weight management through personalised diet programmes — led by a clinician who's walked the path herself.
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <Section id="stats" className="bg-white !py-12 md:!py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {milestones.map(({ icon: Icon, value, label, color }) => (
                        <div key={label} className="bg-surface border border-gray-100 rounded-3xl p-6 md:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                            <Icon size={28} className={`mx-auto mb-3 ${color}`} />
                            <div className="text-3xl md:text-4xl font-heading font-black text-heading mb-1">{value}</div>
                            <div className="text-para text-xs md:text-sm font-medium">{label}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* About TDC */}
            <Section id="about-tdc" className="bg-surface">
                <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                    <div className="space-y-6">
                        <div>
                            <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Who We Are</span>
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading leading-tight mb-4">{data.about.title}</h2>
                            <div className="h-1 w-16 bg-primary rounded-full" />
                        </div>
                        <div className="space-y-5">
                            {data.about.paragraphs.map((p, i) => (
                                <p key={i} className="text-para text-sm md:text-base leading-relaxed border-l-4 border-gray-200 hover:border-primary/40 pl-4 transition-colors duration-200">
                                    {p}
                                </p>
                            ))}
                        </div>
                        <Link
                            href="/checkout"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-primary/20 active:scale-95"
                        >
                            Start Your Journey <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="relative flex justify-center">
                        <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-3xl" />
                        <div className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-gray-100">
                            <Image
                                src="/images/logo.png"
                                alt="The Diet Cascade Logo"
                                width={300}
                                height={300}
                                className="object-contain drop-shadow-lg mx-auto"
                            />
                        </div>
                    </div>
                </div>
            </Section>

            {/* Meet the Dietitian */}
            <Section id="meet-sabah" className="bg-white">
                <div className="text-center mb-12">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Meet The Expert</span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">{data.aboutDt.subtitle}</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center max-w-5xl mx-auto">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl" />
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[3/4]">
                            <Image
                                src={data.aboutDt.image}
                                alt={data.aboutDt.name}
                                fill
                                className="object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-heading/60 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3">
                                    <p className="text-white font-heading font-bold text-lg">{data.aboutDt.name}</p>
                                    <p className="text-white/70 text-sm">Clinical Dietitian & Lifestyle Coach</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {data.aboutDt.description.map((para, i) => (
                            <p key={i} className="text-para text-sm md:text-base leading-relaxed">
                                {para}
                            </p>
                        ))}
                        <blockquote className="border-l-4 border-primary pl-6 italic text-heading font-heading font-semibold text-lg">
                            "{data.dietPerspective.quote}"
                        </blockquote>
                    </div>
                </div>
            </Section>

            {/* Our Values */}
            <Section id="values" className="bg-surface">
                <div className="text-center mb-12">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">What Drives Us</span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">Our Core Values</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {values.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-heading/5 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                                <Icon size={24} className="text-primary group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl font-heading font-bold text-heading mb-3">{title}</h3>
                            <p className="text-para text-sm leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* CTA */}
            <Section id="about-cta" className="bg-white">
                <div className="bg-heading rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl max-w-4xl mx-auto">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-[90px]" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                        <span className="text-accent text-xs font-bold uppercase tracking-wider mb-4 block">Begin Today</span>
                        <h3 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">Ready to Transform Your Health?</h3>
                        <p className="text-white/60 max-w-xl mx-auto mb-8 text-sm md:text-base">
                            Join thousands of clients who have achieved lasting results with Dt. Sabah Ghare's personalised approach.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/checkout" className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 duration-150 inline-flex items-center gap-2">
                                Get Your Plan <ArrowRight size={18} />
                            </Link>
                            <Link href="/faq" className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold rounded-2xl transition-all active:scale-95 duration-150">
                                View FAQs
                            </Link>
                        </div>
                    </div>
                </div>
            </Section>

            <Footer />
        </main>
    );
}
