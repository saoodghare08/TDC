import LocationPageShell from '@/components/location/LocationPageShell';
import {
    Scale, Activity, Baby, Stethoscope, Dumbbell, Briefcase, Utensils, Clock,
} from 'lucide-react';

export const revalidate = 518400;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

export async function generateMetadata() {
    return {
        title: 'Online Dietitian in Dubai | Personalised Nutrition Consultation — The Diet Cascade',
        description: 'Expert online dietitian consultation for Dubai residents. Personalised diet plans for weight loss, PCOS, body transformation, and clinical nutrition — by certified dietitian Dt. Sabah Ghare.',
        keywords: 'dietitian in dubai, online dietitian dubai, nutritionist dubai, weight loss dietitian dubai, PCOS dietitian dubai, personalized diet plan dubai, clinical dietitian dubai, diet consultation dubai',
        alternates: { canonical: `${BASE}/dietitian-dubai/` },
        openGraph: {
            title: 'Dietitian in Dubai | Online Nutrition Consultation — The Diet Cascade',
            description: 'Personalised online nutrition support for Dubai residents — weight loss, PCOS, body transformation, and more. By Dt. Sabah Ghare.',
            url: `${BASE}/dietitian-dubai/`,
            images: [{ url: `${BASE}/images/logo.png`, width: 1200, height: 630, alt: 'The Diet Cascade — Online Dietitian in Dubai' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'Dietitian in Dubai | The Diet Cascade',
            description: 'Online personalised diet consultation for Dubai residents. Weight loss, PCOS, clinical nutrition by Dt. Sabah Ghare.',
        },
    };
}

const faqs = [
    {
        q: 'Can I consult a dietitian online while living in Dubai?',
        a: 'Yes. The Diet Cascade offers fully online consultations, making it easy for Dubai residents to access personalised nutrition support without attending a clinic. Sessions are scheduled at a mutually convenient time and conducted via call or video.',
    },
    {
        q: 'Does The Diet Cascade have a physical clinic in Dubai?',
        a: 'The Diet Cascade is based in Navi Mumbai, India. Consultations for Dubai clients are conducted entirely online — which is typically more convenient for Dubai\'s busy lifestyle. All plan materials, recipes, and support are delivered digitally.',
    },
    {
        q: 'Can a diet plan work around Dubai\'s food environment?',
        a: 'Absolutely. Plans include practical guidance for eating out at Dubai restaurants, using meal delivery services, cooking with supermarket ingredients, and navigating the diverse food options available in the city.',
    },
    {
        q: 'Can I get a personalized diet plan for weight loss in Dubai?',
        a: 'Yes. Weight management is one of the core services at TDC. Your plan is built around your body composition, lifestyle, activity level, and food preferences — not a generic calorie-deficit approach.',
    },
    {
        q: 'Do you provide nutrition support for PCOS?',
        a: 'Yes. PCOS nutrition management is part of the clinic\'s women\'s health services — with dietary strategies focused on hormonal balance, weight management, and sustainable lifestyle habits.',
    },
    {
        q: 'How are follow-up consultations handled for Dubai clients?',
        a: 'Follow-up calls are scheduled based on your programme tier. Between calls, WhatsApp is used for ongoing meal monitoring, progress tracking, and real-time guidance — so you are never left without support.',
    },
    {
        q: 'How do I book a diet consultation for Dubai?',
        a: 'Visit the booking page, submit your details, and our team will contact you via WhatsApp to schedule your first consultation.',
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

export default function DubaiPage() {
    return (
        <LocationPageShell
            breadcrumbs={[
                { name: 'Home', url: '/' },
                { name: 'Dietitian in Dubai', url: '/dietitian-dubai/' },
            ]}
            faqJsonLd={faqJsonLd}
            hero={{
                eyebrow: 'Dubai · Online Nutrition Consultations',
                h1: 'Online Dietitian in Dubai',
                body: 'Personalised nutrition support for Dubai residents — designed around the realities of city life: long work hours, diverse dining options, and the ambition to perform and feel your best. Expert clinical guidance, fully online.',
                primaryCta: { href: '/checkout', label: 'Book a Consultation' },
                secondaryCta: { href: '/about', label: 'About Dt. Sabah' },
            }}
            intro={{
                eyebrow: 'Nutrition for Dubai Life',
                heading: 'Clinical Nutrition That Fits Your Dubai Lifestyle',
                paragraphs: [
                    'Dubai is one of the most dynamic cities in the world — and one of the most demanding. High-pressure careers, social dining, late-night schedules, frequent travel, and a food environment that spans everything from Michelin-starred restaurants to South Asian home cooking create a uniquely complex nutritional landscape.',
                    'The Diet Cascade provides online nutrition consultations specifically designed to work within this context. Dt. Sabah Ghare — a clinical dietitian with a master\'s in clinical nutrition and advanced exercise physiology training — builds personalised diet plans that are grounded in your actual life, not an idealistic version of it.',
                    'Consultations are fully online, making them convenient for Dubai\'s busy professionals, parents, and health-conscious residents. You receive a comprehensive plan with recipes, practical restaurant guidance, and ongoing WhatsApp support — all without needing to visit a clinic.',
                ],
            }}
            services={[
                {
                    icon: Scale,
                    title: 'Weight Loss',
                    description: 'Evidence-based weight loss plans built for Dubai\'s dining culture — practical, sustainable, and never based on crash dieting.',
                    href: '/regimens',
                },
                {
                    icon: Dumbbell,
                    title: 'Body Transformation',
                    description: 'Nutrition aligned with your gym and fitness goals — for fat loss, muscle building, or overall body recomposition.',
                    href: '/regimens',
                },
                {
                    icon: Activity,
                    title: 'PCOS Nutrition',
                    description: 'Specialist dietary plans for women managing PCOS, developed to support hormonal balance and long-term lifestyle change.',
                    href: '/regimens',
                },
                {
                    icon: Stethoscope,
                    title: 'Therapeutic Nutrition',
                    description: 'Clinical dietary management for metabolic conditions — reviewed against blood reports and health history.',
                    href: '/regimens',
                },
                {
                    icon: Baby,
                    title: 'Pregnancy & Postnatal Nutrition',
                    description: 'Nutrition support for expectant and new mothers — focused on health and well-being throughout the journey.',
                    href: '/regimens',
                },
                {
                    icon: Briefcase,
                    title: 'Busy Professional Nutrition',
                    description: 'Practical meal planning for Dubai professionals managing demanding schedules, client dinners, and frequent travel.',
                },
            ]}
            locationSection={{
                eyebrow: 'Dubai-Specific Context',
                heading: 'Nutrition That Works in the Real Dubai',
                body: [
                    'Dubai presents a set of lifestyle realities that generic nutrition plans are not built for. Long weekdays, irregular meal times, frequent restaurant dining, the cultural significance of food in social settings, and a summer heat that discourages outdoor activity all affect how you eat and how your body manages weight and energy.',
                    'Consultations with The Diet Cascade acknowledge these realities from the start. Rather than prescribing a rigid home-cooking-only plan, Dt. Sabah Ghare provides guidance that works in restaurants, with delivery apps, in supermarkets across Dubai, and within the social and cultural norms of life in the city.',
                    'Dubai is also home to a large and diverse South Asian community. TDC\'s deep familiarity with Indian, Pakistani, Sri Lankan, and Bangladeshi food cultures means plans for expats in this community are built around familiar ingredients and cooking methods — not unfamiliar Western dietary templates.',
                ],
            }}
            howItWorks={[
                { step: '1', title: 'Book Your Consultation', description: 'Submit your details via the booking page. Our team connects with you via WhatsApp within one business day.' },
                { step: '2', title: 'Comprehensive Nutrition Assessment', description: 'Share your medical history, blood reports, dietary habits, daily schedule, and health goals for a thorough initial review.' },
                { step: '3', title: 'Personalised Plan Delivery', description: 'Receive a full meal plan with recipes, quantities, and restaurant-friendly alternatives — tailored to life in Dubai.' },
                { step: '4', title: 'WhatsApp Monitoring', description: 'Daily or regular meal check-ins via WhatsApp keep you accountable and allow real-time plan adjustments.' },
                { step: '5', title: 'Progress Review Calls', description: 'Scheduled calls to review your progress — weight, measurements, energy, blood results — and refine your approach.' },
            ]}
            whyTDC={[
                { title: 'Understands Dubai Living', description: 'Plans account for dining out, frequent travel, busy schedules, and the diverse food landscape unique to Dubai.' },
                { title: 'Fully Online, No Commute', description: 'Convenient for Dubai\'s busy professionals — consultation, plan delivery, and follow-ups all happen digitally.' },
                { title: 'Clinical Training', description: 'Dt. Sabah Ghare holds a master\'s in clinical nutrition, not just a wellness certification. Plans are evidence-informed.' },
                { title: 'Strong UAE Client Base', description: 'Dubai has been one of TDC\'s most active markets — clients here include professionals, parents, and health-focused individuals.' },
                { title: 'Supplement-Minimal Approach', description: 'Nutrition through food first. Supplements are only recommended when clinically appropriate.' },
                { title: 'WhatsApp-First Support', description: 'Real support between sessions — not just a document and a goodbye. WhatsApp access keeps you supported daily.' },
            ]}
            faqs={faqs}
            ctaSection={{
                heading: 'Ready for Nutrition Support in Dubai?',
                sub: 'Book an online consultation with Dt. Sabah Ghare — personalised clinical nutrition, designed for life in Dubai.',
                primaryLabel: 'Book a Consultation',
            }}
        />
    );
}
