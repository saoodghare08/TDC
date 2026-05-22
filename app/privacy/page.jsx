import { getSeoMetadata } from '@/utils/getSeoMetadata';
export const revalidate = 518400; // 6 days
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import Link from 'next/link';
import { Shield, AlertCircle, ArrowRight, RefreshCw, ClipboardList, Clock } from 'lucide-react';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';

export async function generateMetadata() {
    return getSeoMetadata('/privacy', {
        title: 'Privacy & Refund Policy | The Diet Cascade',
        description: 'Read the refund policy and privacy practices of The Diet Cascade. Understand how we handle payments, subscriptions, and client data.',
        keywords: 'tdc refund policy, diet cascade privacy, diet plan refund, subscription policy, sabah ghare policy',
    });
}

const policySections = [
    {
        icon: RefreshCw,
        title: 'Refund Policy',
        subsections: [
            {
                heading: 'General Policy',
                body: 'If a client is unsatisfied with any of our regimens, they have the option to terminate their diet subscription. However, please note that we do not offer refunds, freezing, or transferring of fees/services for any of our regimes. By agreeing to this client agreement, you acknowledge that the fees or any other amount paid to us are non-refundable.'
            },
            {
                heading: 'Medical Exceptions',
                body: 'In the case of serious medical conditions, we may, at our discretion, provide a refund under the following conditions:',
                bullets: [
                    'The refund will be processed within 40 working days.',
                    'Your refund request must be accompanied by a doctor\'s prescription. Please note that pregnancy is not considered a serious medical condition.',
                    'The refund amount will be calculated based on the duration used or according to the plan provided, with charges deducted accordingly.',
                ]
            },
            {
                heading: 'Payment Terms',
                body: 'By agreeing to this client agreement, you accept and agree to abide by our refund policy. Payments are to be made by the client as per the mutually agreed schedule and are non-refundable.'
            }
        ]
    },
    {
        icon: Shield,
        title: 'Privacy Practices',
        subsections: [
            {
                heading: 'Information We Collect',
                body: 'We collect personal information you provide directly to us, including name, contact information, health data, dietary preferences, and payment details. This information is used solely to deliver and improve our diet programmes and services.'
            },
            {
                heading: 'How We Use Your Data',
                bullets: [
                    'To create and deliver personalised diet plans tailored to your health goals.',
                    'To communicate progress updates, follow-up calls, and plan revisions.',
                    'To process payments and maintain records of your subscription.',
                    'To improve our services, research, and programme development.',
                ]
            },
            {
                heading: 'Data Security',
                body: 'Your health and personal information is treated with strict confidentiality. We do not sell, share, or disclose client data to third parties without consent, except where required by law.'
            },
            {
                heading: 'Retention',
                body: 'Client data is retained for the duration of your programme and for a reasonable period after its conclusion for record-keeping purposes. You may request deletion of your data at any time by contacting us.'
            }
        ]
    }
];

export default async function PrivacyPolicyPage() {
    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            <BreadcrumbSchema items={[
                { name: 'Home', url: '/' },
                { name: 'Privacy & Refund Policy', url: '/privacy' },
            ]} />
            <Navbar />

            {/* Hero Banner */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
                <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
                        Transparency First
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Privacy & <span className="text-primary">Refund Policy</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        Our commitment to clarity — how we handle payments, subscriptions, and your personal information.
                    </p>
                </div>
            </div>

            {/* Last Updated */}
            <div className="max-w-3xl mx-auto px-5 pt-10">
                <div className="flex items-center gap-2 text-para text-sm">
                    <Clock size={14} className="text-primary" />
                    <span>Last updated: <strong className="text-heading">May 2025</strong></span>
                </div>
            </div>

            {/* Policy Content */}
            <Section id="policy-content" className="bg-surface">
                <div className="max-w-3xl mx-auto space-y-12">
                    {policySections.map(({ icon: Icon, title, subsections }) => (
                        <div key={title} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon size={22} className="text-primary" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">{title}</h2>
                            </div>

                            <div className="space-y-8">
                                {subsections.map((sub, i) => (
                                    <div key={i}>
                                        <h3 className="text-base md:text-lg font-heading font-bold text-heading mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-5 bg-primary rounded-full inline-block" />
                                            {sub.heading}
                                        </h3>
                                        {sub.body && (
                                            <p className="text-para text-sm md:text-base leading-relaxed mb-4">{sub.body}</p>
                                        )}
                                        {sub.bullets && (
                                            <ul className="space-y-2.5 ml-4">
                                                {sub.bullets.map((bullet, j) => (
                                                    <li key={j} className="flex items-start gap-3 text-para text-sm leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                        {bullet}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Notice */}
                    <div className="flex items-start gap-4 bg-amber-50 border border-amber-200/60 rounded-[1.5rem] p-6">
                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-amber-800 text-sm leading-relaxed">
                            By enrolling in any programme at The Diet Cascade, you confirm you have read, understood, and agreed to these policies. For questions, please contact us at{' '}
                            <a href="mailto:sabahghare24@gmail.com" className="font-semibold underline hover:no-underline">sabahghare24@gmail.com</a>.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/terms"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-heading text-white font-bold rounded-2xl transition-all active:scale-95 duration-150 hover:bg-heading/90 text-sm"
                        >
                            <ClipboardList size={16} /> Read Terms & Conditions
                        </Link>
                        <Link
                            href="/contact"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 hover:border-primary/30 text-heading font-bold rounded-2xl transition-all active:scale-95 duration-150 text-sm"
                        >
                            Contact Us <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </Section>

            <Footer />
        </main>
    );
}
