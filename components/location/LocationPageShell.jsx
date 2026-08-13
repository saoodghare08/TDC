import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import Image from 'next/image';

// ─── FAQ Accordion (client-side state free — CSS-only details/summary) ───────
function FAQItem({ q, a }) {
    return (
        <details className="group border-b border-gray-100 last:border-0">
            <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none text-heading font-semibold text-sm md:text-base hover:text-primary transition-colors select-none">
                {q}
                <ChevronDown size={18} className="shrink-0 text-para group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <p className="text-para text-sm leading-relaxed pb-5 pr-8">{a}</p>
        </details>
    );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────
export default function LocationPageShell({
    breadcrumbs,
    faqJsonLd,
    hero,         // { eyebrow, h1, body, primaryCta, secondaryCta }
    intro,        // { eyebrow, heading, paragraphs }
    services,     // [{ icon: LucideComponent, title, description, href? }]
    locationSection, // { eyebrow, heading, body (array of paragraphs) }
    howItWorks,   // [{ step, title, description }]
    whyTDC,       // [{ title, description }]
    faqs,         // [{ q, a }]
    ctaSection,   // { heading, sub, primaryLabel }
}) {
    const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            {/* Structured data */}
            <BreadcrumbSchema items={breadcrumbs} />
            {faqJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
            )}

            <Navbar />

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
                <div className="absolute inset-0 bg-[url('/images/hero1.jpg')] bg-cover bg-center opacity-10" />

                <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
                        {hero.eyebrow}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        {hero.h1}
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed mb-10">
                        {hero.body}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={hero.primaryCta.href}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl transition-all duration-150 shadow-lg shadow-primary/30 active:scale-95"
                        >
                            {hero.primaryCta.label} <ArrowRight size={18} />
                        </Link>
                        {hero.secondaryCta && (
                            <Link
                                href={hero.secondaryCta.href}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold rounded-2xl transition-all duration-150 active:scale-95"
                            >
                                {hero.secondaryCta.label}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Introduction ──────────────────────────────────────────────── */}
            <Section id="intro" className="bg-white">
                <div className="max-w-3xl mx-auto">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">{intro.eyebrow}</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-6 leading-tight">{intro.heading}</h2>
                    <div className="h-1 w-14 bg-primary rounded-full mb-8" />
                    <div className="space-y-5">
                        {intro.paragraphs.map((p, i) => (
                            <p key={i} className="text-para text-sm md:text-base leading-relaxed">{p}</p>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── Services ──────────────────────────────────────────────────── */}
            <Section id="services" className="bg-surface">
                <div className="text-center mb-12">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">What We Offer</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">Nutrition Services</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(({ icon: Icon, title, description, href }) => (
                        <div key={title} className="bg-white rounded-[1.75rem] p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-heading/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300 shrink-0">
                                <Icon size={22} className="text-primary group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-heading mb-2">{title}</h3>
                                <p className="text-para text-sm leading-relaxed">{description}</p>
                            </div>
                            {href && (
                                <Link href={href} className="text-primary text-xs font-bold uppercase tracking-wider mt-auto inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
                                    Learn more <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Location-specific section ──────────────────────────────────── */}
            {locationSection && (
                <Section id="location-context" className="bg-white">
                    <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                        <div className="space-y-6">
                            <div>
                                <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">{locationSection.eyebrow}</span>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading leading-tight mb-4">{locationSection.heading}</h2>
                                <div className="h-1 w-14 bg-primary rounded-full" />
                            </div>
                            <div className="space-y-4">
                                {locationSection.body.map((p, i) => (
                                    <p key={i} className="text-para text-sm md:text-base leading-relaxed">{p}</p>
                                ))}
                            </div>
                            <Link
                                href="/checkout"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl transition-all duration-150 shadow-lg shadow-primary/20 active:scale-95 text-sm"
                            >
                                Book a Consultation <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl">
                            <Image
                                src="/images/diet-p.jpg"
                                alt="Online nutrition consultation with Dt. Sabah Ghare"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-heading/30 to-transparent" />
                        </div>
                    </div>
                </Section>
            )}

            {/* ── How It Works ──────────────────────────────────────────────── */}
            <Section id="how-it-works" className="bg-surface">
                <div className="text-center mb-14">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">The Process</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">How It Works</h2>
                </div>
                <div className="relative max-w-3xl mx-auto">
                    {/* Vertical connector line */}
                    <div className="absolute left-6 md:left-8 top-8 bottom-8 w-px bg-gray-200 hidden sm:block" />
                    <div className="space-y-8">
                        {howItWorks.map(({ step, title, description }) => (
                            <div key={step} className="flex gap-6 md:gap-8 items-start group">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white border-2 border-primary/20 group-hover:border-primary group-hover:bg-primary/5 flex items-center justify-center font-heading font-black text-primary text-lg shrink-0 transition-all duration-300 shadow-sm z-10">
                                    {step}
                                </div>
                                <div className="pt-2 md:pt-4">
                                    <h3 className="text-base font-bold text-heading mb-1.5">{title}</h3>
                                    <p className="text-para text-sm leading-relaxed">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── Why TDC ───────────────────────────────────────────────────── */}
            <Section id="why-tdc" className="bg-white">
                <div className="text-center mb-12">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Our Approach</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">Why The Diet Cascade</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {whyTDC.map(({ title, description }) => (
                        <div key={title} className="bg-surface rounded-[1.75rem] p-7 border border-gray-50 flex gap-4">
                            <CheckCircle2 size={20} className="text-primary shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-heading mb-1.5">{title}</h3>
                                <p className="text-para text-sm leading-relaxed">{description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── FAQs ──────────────────────────────────────────────────────── */}
            <Section id="faqs" className="bg-surface">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Common Questions</span>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">Frequently Asked Questions</h2>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm divide-y divide-gray-100 px-6 md:px-10">
                        {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
                    </div>
                </div>
            </Section>

            {/* ── Bottom CTA ────────────────────────────────────────────────── */}
            <Section id="cta" className="bg-white">
                <div className="bg-heading rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl max-w-4xl mx-auto">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-[90px]" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                        <span className="text-accent text-xs font-bold uppercase tracking-wider mb-4 block">Begin Today</span>
                        <h2 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">{ctaSection.heading}</h2>
                        <p className="text-white/60 max-w-xl mx-auto mb-8 text-sm md:text-base">{ctaSection.sub}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/checkout"
                                className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 duration-150 inline-flex items-center gap-2"
                            >
                                {ctaSection.primaryLabel} <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/about"
                                className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold rounded-2xl transition-all active:scale-95 duration-150"
                            >
                                Learn About Dt. Sabah
                            </Link>
                        </div>
                    </div>
                </div>
            </Section>

            <Footer />
        </main>
    );
}
