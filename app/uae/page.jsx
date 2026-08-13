import LocationPageShell from '@/components/location/LocationPageShell';
import {
    Scale, Activity, Baby, Stethoscope, Dumbbell, Globe, Heart, Utensils,
} from 'lucide-react';

export const revalidate = 518400;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

export async function generateMetadata() {
    return {
        title: 'Online Dietitian in UAE | Personalised Nutrition Plans — The Diet Cascade',
        description: 'Consult a certified clinical dietitian online from anywhere in the UAE. Personalised diet plans for weight loss, PCOS, and healthy living — serving clients across Emirates.',
        keywords: 'dietitian in UAE, online dietitian UAE, nutritionist UAE, weight loss dietitian UAE, PCOS dietitian UAE, personalized diet plan UAE, clinical dietitian UAE, online nutritionist UAE',
        alternates: { canonical: `${BASE}/uae/` },
        openGraph: {
            title: 'Dietitian in UAE | Online Nutrition Consultation — The Diet Cascade',
            description: 'Online personalised nutrition support for UAE residents across all Emirates — by certified clinical dietitian Dt. Sabah Ghare.',
            url: `${BASE}/uae/`,
            images: [{ url: `${BASE}/images/logo.png`, width: 1200, height: 630, alt: 'The Diet Cascade — Online Dietitian in UAE' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'Dietitian in UAE | The Diet Cascade',
            description: 'Personalised nutrition consultations for UAE residents — weight loss, PCOS, clinical nutrition, and more.',
        },
    };
}

const faqs = [
    {
        q: 'Can I consult a dietitian online from anywhere in the UAE?',
        a: 'Yes. The Diet Cascade provides online consultations for clients across all Emirates — including Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.',
    },
    {
        q: 'How do online dietitian consultations work for UAE residents?',
        a: 'After booking, you will be contacted via WhatsApp to schedule your initial session. Dt. Sabah reviews your health background, dietary habits, and goals, then delivers a personalised meal plan with recipes. Ongoing support is provided via WhatsApp between sessions.',
    },
    {
        q: 'Can the diet plan accommodate the UAE lifestyle and food environment?',
        a: 'Yes. Plans are designed to be practical in a UAE context — accounting for eating out, international food options, busy work schedules, and the wide range of cuisines available across the Emirates.',
    },
    {
        q: 'Is this service suitable for South Asian expats in the UAE?',
        a: 'Absolutely. A significant proportion of TDC clients are South Asian — Indian, Pakistani, Sri Lankan, and Bangladeshi expats who want nutrition support that reflects their food culture while addressing health goals relevant to their community.',
    },
    {
        q: 'Can a dietitian help with weight management in the UAE?',
        a: 'Yes. Weight management is one of the core services at The Diet Cascade, with plans tailored to your body, lifestyle, activity level, and dietary preferences — not a generic calorie-restriction approach.',
    },
    {
        q: 'Can I get nutrition support for PCOS while living in the UAE?',
        a: 'Yes. PCOS nutrition management is offered as part of our women\'s health services, with dietary plans designed to support hormonal balance and weight management.',
    },
    {
        q: 'What language are consultations conducted in?',
        a: 'Consultations are conducted in English. Reach out to confirm if you have any specific language requirements.',
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

export default function UAEPage() {
    return (
        <LocationPageShell
            breadcrumbs={[
                { name: 'Home', url: '/' },
                { name: 'Dietitian in UAE', url: '/uae/' },
            ]}
            faqJsonLd={faqJsonLd}
            hero={{
                eyebrow: 'United Arab Emirates · Online Nutrition',
                h1: 'Online Dietitian in UAE',
                body: 'Personalised clinical nutrition for UAE residents across every Emirate. Whether you are managing your weight, navigating PCOS, or building a healthier lifestyle around a busy UAE schedule — expert support is available online.',
                primaryCta: { href: '/checkout', label: 'Book Online Consultation' },
                secondaryCta: { href: '/regimens', label: 'Explore Programmes' },
            }}
            intro={{
                eyebrow: 'About the Service',
                heading: 'Clinical Nutrition for Life in the UAE',
                paragraphs: [
                    'Living in the UAE presents a unique set of nutritional challenges and opportunities. A fast-paced work culture, an abundant dining-out scene, diverse cuisines, extreme summer heat, and a predominantly sedentary urban lifestyle all influence how you eat and how your body responds.',
                    'The Diet Cascade provides online nutrition consultations for UAE residents seeking structured, personalised support from a qualified clinical dietitian. Dt. Sabah Ghare — who holds a master\'s in clinical nutrition and an advanced exercise physiology certification — serves clients across Dubai, Abu Dhabi, Sharjah, and all other Emirates through a fully online consultation model.',
                    'Whether you are an expat maintaining roots in South Asian food culture, a UAE national seeking nutrition support aligned with traditional cuisine, or a health-conscious resident navigating the international food landscape — your plan is built around your actual dietary life, not an idealised version of it.',
                ],
            }}
            services={[
                {
                    icon: Scale,
                    title: 'Weight Management',
                    description: 'Personalised weight loss or weight gain plans — built around the UAE lifestyle, dining environment, and your specific health profile.',
                    href: '/regimens',
                },
                {
                    icon: Activity,
                    title: 'PCOS Nutrition Support',
                    description: 'Specialist dietary planning for women managing PCOS — focused on hormonal health and sustainable lifestyle change.',
                    href: '/regimens',
                },
                {
                    icon: Dumbbell,
                    title: 'Body Transformation',
                    description: 'Structured nutrition for fat loss, muscle gain, and athletic performance — aligned with your fitness goals.',
                    href: '/regimens',
                },
                {
                    icon: Stethoscope,
                    title: 'Therapeutic Nutrition',
                    description: 'Dietary management for metabolic conditions — reviewed against blood reports for clinical precision.',
                    href: '/regimens',
                },
                {
                    icon: Baby,
                    title: 'Gestational & Postnatal Nutrition',
                    description: 'Evidence-informed dietary support for mothers before and after childbirth, with a focus on overall well-being.',
                    href: '/regimens',
                },
                {
                    icon: Utensils,
                    title: 'Personalised Meal Planning',
                    description: 'Customised meal plans with recipes — designed to be practical within the UAE food environment, including restaurant guidance.',
                },
            ]}
            locationSection={{
                eyebrow: 'Nutrition Across the Emirates',
                heading: 'Serving Clients Across Every Emirate',
                body: [
                    'The UAE is home to a highly diverse population — long-term residents, short-term expats, UAE nationals, and international professionals — each with different food cultures, health histories, and nutrition goals. One nutrition approach cannot serve all of these needs.',
                    'The Diet Cascade\'s online model is well-suited to this reality. Consultations take place via scheduled calls, with personalised plans delivered digitally and ongoing support via WhatsApp. Clients in Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, and beyond have the same access as those based in Dubai.',
                    'Plans are built to work within the UAE food environment — accounting for supermarket availability, restaurant dining, meal delivery apps, and the strong presence of South Asian, Middle Eastern, and international cuisines across the country.',
                ],
            }}
            howItWorks={[
                { step: '1', title: 'Book Your Session', description: 'Fill in the booking form with your contact details and the goal you would like to work towards.' },
                { step: '2', title: 'Comprehensive Assessment', description: 'Share your health history, blood reports, dietary habits, activity level, and schedule so Dt. Sabah can build your plan accurately.' },
                { step: '3', title: 'Plan Delivered to You', description: 'Receive a detailed, personalised meal plan with recipes, quantities, and practical guidance for eating in the UAE context.' },
                { step: '4', title: 'WhatsApp Support', description: 'Ongoing meal monitoring and direct access via WhatsApp — for questions, check-ins, and real-time adjustments.' },
                { step: '5', title: 'Follow-Up Reviews', description: 'Scheduled progress calls to review results and refine your plan as your body responds and goals evolve.' },
            ]}
            whyTDC={[
                { title: 'Serving UAE Clients Since Inception', description: 'The UAE has been one of TDC\'s strongest markets since day one — with a strong base of expat and resident clients across multiple Emirates.' },
                { title: 'No Clinic Visit Needed', description: 'Fully online. Book, consult, and receive your plan without leaving home — especially convenient for busy UAE schedules.' },
                { title: 'Culturally Aware Nutrition', description: 'Plans account for South Asian, Middle Eastern, and international dietary preferences that reflect life in the UAE.' },
                { title: 'Clinical Dietitian, Not a Coach', description: 'Dt. Sabah Ghare holds a master\'s in clinical nutrition — your plan is backed by clinical training, not just general wellness knowledge.' },
                { title: '8+ Countries of Experience', description: 'With clients across 8+ countries including a substantial UAE base, TDC understands what works in diverse cultural and food contexts.' },
                { title: 'Supplement-Minimal Approach', description: 'Plans are built around whole foods. Supplements are only included when clinically appropriate — not as a default recommendation.' },
            ]}
            faqs={faqs}
            ctaSection={{
                heading: 'Ready to Start Your Nutrition Journey in the UAE?',
                sub: 'Book an online consultation with Dt. Sabah Ghare and receive a personalised plan designed for your lifestyle and goals.',
                primaryLabel: 'Book Online Consultation',
            }}
        />
    );
}
