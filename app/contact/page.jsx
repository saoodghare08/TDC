import { getSeoMetadata } from '@/utils/getSeoMetadata';
export const revalidate = 518400; // 6 days
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import data from '@/data/content.json';
import Link from 'next/link';
import { Phone, Mail, Instagram, Linkedin, MapPin, MessageCircle, Clock, ArrowRight } from 'lucide-react';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';

export async function generateMetadata() {
    return getSeoMetadata('/contact', {
        title: 'Contact Us | The Diet Cascade',
        description: 'Get in touch with Dt. Sabah Ghare and The Diet Cascade team. Reach us via WhatsApp, email, Instagram, or LinkedIn.',
        keywords: 'contact diet cascade, sabah ghare contact, diet consultation contact, thedietcascade contact',
    });
}

const contactMethods = [
    {
        icon: Phone,
        label: 'WhatsApp / Call',
        value: data.contact.phone,
        href: `https://wa.me/${data.contact.phone.replace(/\D/g, '')}`,
        description: 'Chat with us directly on WhatsApp for quick responses.',
        cta: 'Message on WhatsApp',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        iconBg: 'bg-emerald-100',
    },
    {
        icon: Mail,
        label: 'Email',
        value: data.contact.email,
        href: `mailto:${data.contact.email}`,
        description: 'Send us an email for detailed enquiries or partnership requests.',
        cta: 'Send Email',
        color: 'bg-blue-50 text-blue-600 border-blue-100',
        iconBg: 'bg-blue-100',
    },
    {
        icon: Instagram,
        label: 'Instagram',
        value: '@thedietcascade',
        href: data.contact.instagram,
        description: 'Follow our journey, tips, and client transformations on Instagram.',
        cta: 'Follow Us',
        color: 'bg-pink-50 text-pink-600 border-pink-100',
        iconBg: 'bg-pink-100',
    },
    {
        icon: Linkedin,
        label: 'LinkedIn',
        value: 'Dt. Sabah Ghare',
        href: data.contact.linkedin,
        description: 'Connect professionally with Dt. Sabah Ghare on LinkedIn.',
        cta: 'Connect',
        color: 'bg-sky-50 text-sky-600 border-sky-100',
        iconBg: 'bg-sky-100',
    },
];

export default async function ContactPage() {
    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            <BreadcrumbSchema items={[
                { name: 'Home', url: '/' },
                { name: 'Contact', url: '/contact' },
            ]} />
            <Navbar />

            {/* Hero Banner */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
                <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
                        We're Here to Help
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Get in <span className="text-primary">Touch</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        Have a question about our programmes? Want to start your health journey? We'd love to hear from you.
                    </p>
                </div>
            </div>

            {/* Response Time Banner */}
            <div className="max-w-4xl mx-auto px-5 -mt-6 relative z-20">
                <div className="bg-white border border-gray-150 rounded-[2rem] px-6 py-4 shadow-xl shadow-heading/5 flex items-center justify-center gap-3 text-para text-sm">
                    <Clock size={16} className="text-primary shrink-0" />
                    <span>We typically respond within <strong className="text-heading">24–48 working hours</strong> across all channels.</span>
                </div>
            </div>

            {/* Contact Methods */}
            <Section id="contact-methods" className="bg-surface">
                <div className="text-center mb-12">
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Reach Us</span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-heading">How to Connect</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 md:gap-6 max-w-4xl mx-auto">
                    {contactMethods.map(({ icon: Icon, label, value, href, description, cta, color, iconBg }) => (
                        <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group bg-white border rounded-[2rem] p-7 md:p-8 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:shadow-heading/5 transition-all duration-300 hover:-translate-y-1 ${color}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
                                <Icon size={22} />
                            </div>
                            <div className="flex-1">
                                <span className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-1">{label}</span>
                                <p className="font-heading font-bold text-heading text-base md:text-lg mb-2">{value}</p>
                                <p className="text-para text-sm leading-relaxed">{description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                {cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </div>
                        </a>
                    ))}
                </div>
            </Section>

            {/* Location */}
            <Section id="location" className="bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <MapPin size={28} className="text-primary" />
                    </div>
                    <span className="text-primary font-bold tracking-widest uppercase text-xs block mb-3">Location</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">Where We Operate</h2>
                    <p className="text-para text-base leading-relaxed max-w-lg mx-auto mb-4">
                        Based in <strong>Navi Mumbai, Maharashtra, India</strong> — and serving clients across <strong>UAE, USA, UK</strong>, and beyond. All consultations are conducted online, making it convenient for you wherever you are.
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-gray-150 rounded-full text-para text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Serving clients in 8+ countries worldwide
                    </div>
                </div>
            </Section>

            {/* CTA */}
            <Section id="contact-cta" className="bg-surface">
                <div className="bg-heading rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden max-w-4xl mx-auto text-center shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-[90px]" />
                    <div className="relative z-10">
                        <MessageCircle size={48} className="text-primary mx-auto mb-6" />
                        <h3 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">Ready to Start?</h3>
                        <p className="text-white/60 max-w-xl mx-auto mb-8 text-sm md:text-base">
                            Skip the back-and-forth. Choose your plan, submit your details, and Dt. Sabah's team will be in touch within 24–48 hours.
                        </p>
                        <Link
                            href="/checkout"
                            className="inline-flex items-center gap-3 px-10 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 duration-150 text-base"
                        >
                            Book Your Plan <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </Section>

            <Footer />
        </main>
    );
}
