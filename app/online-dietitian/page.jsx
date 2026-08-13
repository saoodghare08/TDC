import LocationPageShell from '@/components/location/LocationPageShell';
import {
    Scale, Activity, Baby, Stethoscope, Dumbbell, Wifi, MessageCircle, Video, Globe, Clock,
} from 'lucide-react';

export const revalidate = 518400;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

export async function generateMetadata() {
    return {
        title: 'Online Dietitian | Virtual Nutrition Consultation — The Diet Cascade',
        description: 'Book an online dietitian consultation with Dt. Sabah Ghare. Personalised diet plans, WhatsApp support, and expert clinical nutrition — accessible from anywhere in the world.',
        keywords: 'online dietitian, online nutritionist, virtual dietitian, online diet consultation, online diet plan, online weight loss dietitian, online PCOS dietitian, online nutrition counseling',
        alternates: { canonical: `${BASE}/online-dietitian/` },
        openGraph: {
            title: 'Online Dietitian | Virtual Nutrition Consultation — The Diet Cascade',
            description: 'Expert online nutrition consultations from a certified clinical dietitian. Personalised diet plans and WhatsApp support — wherever you are.',
            url: `${BASE}/online-dietitian/`,
            images: [{ url: `${BASE}/images/logo.png`, width: 1200, height: 630, alt: 'The Diet Cascade — Online Dietitian Consultation' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'Online Dietitian | The Diet Cascade',
            description: 'Virtual nutrition consultation with certified clinical dietitian Dt. Sabah Ghare. Personalised plans, WhatsApp support, worldwide access.',
        },
    };
}

const faqs = [
    {
        q: 'How does an online dietitian consultation work?',
        a: 'After booking, you are contacted via WhatsApp to schedule your first session. Prior to the call, you share your health history, current diet, blood reports (if available), and goals. Dt. Sabah then conducts a detailed assessment and builds your personalised plan, which is delivered digitally with recipes and guidance.',
    },
    {
        q: 'What happens during the first consultation?',
        a: 'The first session is a comprehensive assessment — covering your medical history, eating habits, daily routine, food preferences, fitness activity, and health goals. This forms the foundation of your personalised nutrition plan.',
    },
    {
        q: 'Can I get a truly personalised diet plan online?',
        a: 'Yes. Every plan at The Diet Cascade is built specifically for you — your food preferences, your schedule, your health conditions, and your goals. No generic templates or pre-made plans.',
    },
    {
        q: 'Is online nutrition counselling as effective as seeing a dietitian in person?',
        a: 'For most nutrition goals, online consultations are equally effective — and often more convenient. The WhatsApp monitoring model at TDC provides more frequent touchpoints than a typical monthly in-person clinic visit.',
    },
    {
        q: 'Can online nutrition support help with weight management?',
        a: 'Yes. Weight management — including sustainable weight loss and healthy weight gain — is one of the core services at TDC. Plans are tailored to your body and lifestyle, not based on generic calorie restriction.',
    },
    {
        q: 'Can I get online support for PCOS?',
        a: 'Yes. PCOS nutrition management is a specialist area at The Diet Cascade, with dietary strategies focused on hormonal support and sustainable lifestyle change — delivered entirely online.',
    },
    {
        q: 'How are follow-up consultations handled?',
        a: 'Follow-up calls are scheduled based on your programme tier. Between calls, WhatsApp is used for daily or regular meal monitoring, progress tracking, and plan adjustments. You are supported throughout — not just on call days.',
    },
    {
        q: 'Which countries can access The Diet Cascade\'s online service?',
        a: 'The Diet Cascade serves clients internationally. Active client communities include India, UAE, UK, USA, Canada, Australia, Saudi Arabia, and Qatar, among others. If you have an internet connection and a WhatsApp account, you can access the service.',
    },
];

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
    })),
};

export default function OnlineDietitianPage() {
    return (
        <LocationPageShell
            breadcrumbs={[
                { name: 'Home', url: '/' },
                { name: 'Online Dietitian', url: '/online-dietitian/' },
            ]}
            faqJsonLd={faqJsonLd}
            hero={{
                eyebrow: 'Worldwide · Online Nutrition Consultation',
                h1: 'Online Dietitian Consultation',
                body: 'Expert clinical nutrition support, wherever you are. Dt. Sabah Ghare delivers personalised diet plans, ongoing WhatsApp monitoring, and evidence-informed guidance — entirely online, with no clinic visits required.',
                primaryCta: { href: '/checkout', label: 'Book Online Consultation' },
                secondaryCta: { href: '/program', label: 'View Programmes' },
            }}
            intro={{
                eyebrow: 'What Is an Online Dietitian?',
                heading: 'Professional Nutrition Support Without the Commute',
                paragraphs: [
                    'An online dietitian provides the same professional nutrition assessment, personalised meal planning, and follow-up support as a clinic-based dietitian — but entirely through digital channels. For the vast majority of nutrition goals, this is equally effective and significantly more convenient.',
                    'The Diet Cascade has operated as an online-first nutrition clinic since its founding. With over 5,000 clients served across 8+ countries and 10,000+ personalised plans created, the clinic has developed a consultation and monitoring process that is purpose-built for the online format — not an afterthought adaptation of in-person care.',
                    'Consultations take place via scheduled call, with WhatsApp used for ongoing meal monitoring, real-time guidance, and progress tracking between sessions. You receive a comprehensive, personalised plan with recipes, quantities, and practical guidance — delivered directly to your phone or inbox.',
                    'Whether you are in India, the UAE, the UK, the USA, or anywhere else in the world — if you have an internet connection, you have access to professional clinical nutrition support.',
                ],
            }}
            services={[
                {
                    icon: Scale,
                    title: 'Online Weight Loss',
                    description: 'Personalised, sustainable weight loss plans — delivered online with WhatsApp monitoring for real-time support.',
                    href: '/regimens',
                },
                {
                    icon: Dumbbell,
                    title: 'Online Body Transformation',
                    description: 'Nutrition for fat loss, muscle gain, or body recomposition — coordinated with your fitness routine, online.',
                    href: '/regimens',
                },
                {
                    icon: Activity,
                    title: 'Online PCOS Nutrition',
                    description: 'Specialist dietary support for PCOS — hormonal health and sustainable lifestyle change, entirely online.',
                    href: '/regimens',
                },
                {
                    icon: Baby,
                    title: 'Gestational & Postnatal',
                    description: 'Nutrition guidance for expecting and new mothers — safe, evidence-informed, and delivered to your phone.',
                    href: '/regimens',
                },
                {
                    icon: Stethoscope,
                    title: 'Online Therapeutic Nutrition',
                    description: 'Clinical diet management for metabolic and health conditions — based on blood report analysis, delivered online.',
                    href: '/regimens',
                },
                {
                    icon: Globe,
                    title: 'International Clients',
                    description: 'Serving clients across India, UAE, UK, USA, Canada, Australia, Saudi Arabia, Qatar, and more.',
                },
            ]}
            locationSection={{
                eyebrow: 'Why Online Works',
                heading: 'The Advantages of Online Nutrition Consultation',
                body: [
                    'Convenience is obvious — no commute, no waiting rooms, no rescheduling around a clinic\'s hours. But the advantages of online nutrition counselling go deeper than that.',
                    'The WhatsApp monitoring model at The Diet Cascade means you have access to support between sessions — not just on call days. Meal check-ins, questions, and plan adjustments can happen in real time, which is simply not possible with a monthly in-person appointment.',
                    'Online also removes geographic barriers entirely. Whether you are a busy professional in Dubai, a new mother in Bengaluru, a student in the UK, or someone in a smaller city without access to qualified clinical dietitian services — the quality of nutrition support you receive is identical.',
                    'For clients in time zones across the globe, sessions are scheduled to suit your local time — making the service genuinely accessible, not just theoretically available.',
                ],
            }}
            howItWorks={[
                { step: '1', title: 'Book Your Online Consultation', description: 'Submit your details via the booking form — your name, WhatsApp number, and what you would like to work on.' },
                { step: '2', title: 'Pre-Session Assessment', description: 'Before your first call, you share your health history, dietary habits, current medications, blood reports (if available), and goals.' },
                { step: '3', title: 'Initial Consultation Call', description: 'A thorough first session where Dt. Sabah discusses your health background, diet, lifestyle, and sets a clear direction for your plan.' },
                { step: '4', title: 'Personalised Plan Delivered', description: 'Your custom meal plan, with recipes, quantities, a supplement assessment, and practical food guidance, is delivered digitally.' },
                { step: '5', title: 'WhatsApp Monitoring & Follow-Ups', description: 'Ongoing support via WhatsApp — regular meal check-ins, progress tracking, and scheduled review calls to keep you on track.' },
            ]}
            whyTDC={[
                { title: 'Purpose-Built for Online', description: 'TDC has always been online-first — the consultation process, monitoring model, and plan delivery are all optimised for digital interaction.' },
                { title: 'Global Client Base', description: '8+ countries, 5000+ clients — The Diet Cascade is experienced in serving diverse populations across time zones and food cultures.' },
                { title: 'WhatsApp Support Between Sessions', description: 'Daily access between sessions means you are supported continuously — not just during scheduled calls.' },
                { title: 'Clinical Dietitian, Not a Coach', description: 'Dt. Sabah Ghare holds a master\'s in clinical nutrition — your plan is evidence-informed, not based on trends or generic wellness advice.' },
                { title: 'Food-First Philosophy', description: 'Plans are built around whole foods and your real dietary preferences. Supplements are only included when clinically indicated.' },
                { title: 'Flexible Programme Lengths', description: 'Choose a 1-month Starter, 3-month Momentum, or 6-month Transformation programme depending on your goals and timeline.' },
            ]}
            faqs={faqs}
            ctaSection={{
                heading: 'Ready to Begin Your Online Nutrition Journey?',
                sub: 'Book your first online consultation with Dt. Sabah Ghare — personalised clinical nutrition, accessible wherever you are.',
                primaryLabel: 'Book Online Consultation',
            }}
        />
    );
}
