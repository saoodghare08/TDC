import { getSeoMetadata } from '@/utils/getSeoMetadata';
export const revalidate = 518400; // 6 days
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import Link from 'next/link';
import { FileText, AlertCircle, ArrowRight, Shield, Clock, ExternalLink } from 'lucide-react';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';

export async function generateMetadata() {
    return getSeoMetadata('/terms', {
        title: 'Terms & Conditions | The Diet Cascade',
        description: 'Read the Terms and Conditions governing The Diet Cascade programmes — including response times, plan delivery, client accountability, and subscription policies.',
        keywords: 'terms and conditions diet cascade, tdc terms, client agreement, diet plan terms, sabah ghare terms',
    });
}

const terms = [
    {
        title: 'Response Time',
        body: 'We aim to respond to customer inquiries within 24–48 working hours.',
    },
    {
        title: 'Refund and Subscription Policy',
        body: 'Please note that we do not offer refunds, and subscriptions cannot be transferred to another person.',
    },
    {
        title: 'Enrollment Process',
        body: 'Formalities must be completed after enrolling for a diet package. The plan will be shared only after payment and formalities are submitted to the head or senior nutritionist.',
    },
    {
        title: 'Plan Customisation and Delivery',
        body: 'Customised plans are shared with customers within 24–48 working hours. Post-enrollment procedures take 2–3 working days as handovers need to be updated.',
    },
    {
        title: 'Client Information',
        body: 'Client information must be accurate and complete. The dietitian cannot be held responsible for any misinformation provided.',
    },
    {
        title: 'Plan Periodisation and Cooperation',
        body: 'Plans are updated every 15–18 days. Clients must cooperate and follow the previous plan until the new one is provided.',
    },
    {
        title: 'Client Accountability',
        body: 'Clients must actively follow the provided diet plan. Failure to do so may result in being considered inactive, and the dietitian will not be responsible for any lack of progress.',
    },
    {
        title: 'Effort and Results',
        body: 'Clients must put in efforts to achieve results. TDC does not guarantee 100% results without client efforts. Results may vary based on individual dedication and commitment.',
    },
    {
        title: 'Duration and Extension',
        body: 'The start and end dates of the diet regimen are fixed and cannot be extended. In emergencies, the plan may be extended for up to 2 weeks for 3 or 6-month regimens.',
    },
    {
        title: 'Customisation and Corrections',
        body: 'The diet regimen is customised according to clients\' preferences. 1–2 corrections are allowed if needed.',
    },
    {
        title: 'Understanding Risks',
        body: 'Clients acknowledge that results may vary based on individual factors. TDC does not guarantee specific results, and clients accept the risk of varying outcomes.',
    },
    {
        title: 'Health Updates',
        body: 'Clients must update the dietitian about any medical or health conditions for appropriate guidance and support. TDC does not accept responsibility for any adverse results or medical problems faced during the programme.',
    },
];

export default async function TermsPage() {
    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            <BreadcrumbSchema items={[
                { name: 'Home', url: '/' },
                { name: 'Terms & Conditions', url: '/terms' },
            ]} />
            <Navbar />

            {/* Hero Banner */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
                <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
                        Client Agreement
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Terms & <span className="text-primary">Conditions</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        Please read these terms carefully before enrolling in any The Diet Cascade programme.
                    </p>
                </div>
            </div>

            {/* Meta Info */}
            <div className="max-w-3xl mx-auto px-5 pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-para text-sm">
                    <Clock size={14} className="text-primary" />
                    <span>Last updated: <strong className="text-heading">May 2025</strong></span>
                </div>
                <a
                    href="https://www.thedietcascade.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline"
                >
                    www.thedietcascade.com <ExternalLink size={12} />
                </a>
            </div>

            {/* Terms Content */}
            <Section id="terms-content" className="bg-surface">
                <div className="max-w-3xl mx-auto">
                    {/* Intro Card */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm mb-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText size={22} className="text-primary" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">Terms and Conditions</h2>
                        </div>
                        <p className="text-para text-sm md:text-base leading-relaxed">
                            These Terms and Conditions govern your use of The Diet Cascade's services and programmes. By enrolling, you confirm that you have read, understood, and agreed to all terms outlined on this page and at{' '}
                            <a href="https://www.thedietcascade.com" className="text-primary font-semibold hover:underline" target="_blank" rel="noopener noreferrer">www.thedietcascade.com</a>.
                        </p>
                    </div>

                    {/* Individual Terms */}
                    <div className="space-y-4">
                        {terms.map((term, index) => (
                            <div key={index} className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-primary text-xs font-black">{String(index + 1).padStart(2, '0')}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-bold text-heading text-base md:text-lg mb-2">{term.title}</h3>
                                        <p className="text-para text-sm md:text-base leading-relaxed">{term.body}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Binding Agreement Notice */}
                    <div className="mt-10 flex items-start gap-4 bg-amber-50 border border-amber-200/60 rounded-[1.5rem] p-6">
                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-800 text-sm font-bold mb-1">Binding Agreement</p>
                            <p className="text-amber-700 text-sm leading-relaxed">
                                By accessing <strong>www.thedietcascade.com</strong> and enrolling in our programmes, you acknowledge that you have read, understood, and agreed to abide by all the Terms and Conditions outlined herein.
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/privacy"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-heading text-white font-bold rounded-2xl transition-all active:scale-95 duration-150 hover:bg-heading/90 text-sm"
                        >
                            <Shield size={16} /> Privacy & Refund Policy
                        </Link>
                        <Link
                            href="/contact"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 hover:border-primary/30 text-heading font-bold rounded-2xl transition-all active:scale-95 duration-150 text-sm"
                        >
                            Questions? Contact Us <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </Section>

            <Footer />
        </main>
    );
}
