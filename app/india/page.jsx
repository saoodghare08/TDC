import LocationPageShell from '@/components/location/LocationPageShell';
import {
    Scale, Activity, Heart, Baby, Stethoscope, Dumbbell, Leaf, Globe, Wifi,
} from 'lucide-react';

export const revalidate = 518400;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

export async function generateMetadata() {
    return {
        title: 'Online Dietitian in India | Personalised Nutrition Plans — The Diet Cascade',
        description: 'Consult a certified clinical dietitian online from anywhere in India. Dt. Sabah Ghare delivers personalised Indian diet plans for weight loss, PCOS, body transformation, and more.',
        keywords: 'dietitian in india, online dietitian india, nutritionist in india, personalized diet plans india, weight loss dietitian india, PCOS dietitian india, online nutritionist india, clinical dietitian india',
        alternates: { canonical: `${BASE}/india/` },
        openGraph: {
            title: 'Dietitian in India | Online Nutrition Consultation — The Diet Cascade',
            description: 'Personalised diet plans for clients across India — built around Indian cuisine, your lifestyle, and evidence-informed nutrition by Dt. Sabah Ghare.',
            url: `${BASE}/india/`,
            images: [{ url: `${BASE}/images/logo.png`, width: 1200, height: 630, alt: 'The Diet Cascade — Online Dietitian in India' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'Dietitian in India | The Diet Cascade',
            description: 'Online nutrition consultations for clients across India. Personalised Indian diet plans by Dt. Sabah Ghare.',
        },
    };
}

const faqs = [
    {
        q: 'Can I consult an online dietitian from anywhere in India?',
        a: 'Yes. The Diet Cascade operates entirely online, which means clients from Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, and every city and town across India can access personalised nutrition support from home.',
    },
    {
        q: 'Are the diet plans built around Indian food?',
        a: 'Every plan is built around your food preferences, regional cuisine, cooking habits, and cultural dietary patterns. Whether you follow a North Indian, South Indian, Gujarati, Maharashtrian, or any other regional diet — your plan will reflect that.',
    },
    {
        q: 'How does an online dietitian consultation work?',
        a: 'After booking, you will be contacted via WhatsApp to schedule your first session. Dt. Sabah reviews your health history, dietary habits, and goals before building your personalised plan. Follow-up calls and meal tracking via WhatsApp keep you supported between sessions.',
    },
    {
        q: 'Is an online consultation as effective as an in-person one?',
        a: 'For nutrition counselling, online consultations can be equally effective — and often more convenient. The ongoing WhatsApp support model means you receive more frequent check-ins than a typical clinic visit would provide.',
    },
    {
        q: 'Can a diet plan help manage conditions like diabetes, thyroid, or high cholesterol?',
        a: 'Therapeutic nutrition is one of the services offered at The Diet Cascade. Dt. Sabah Ghare analyses blood reports and medical history to create an appropriate diet plan. Please note that dietary support is complementary to, not a replacement for, medical treatment.',
    },
    {
        q: 'What is the cost of a consultation?',
        a: 'Plan pricing depends on the duration: 1-month (Starter), 3-month (Momentum), or 6-month (Transformation) programmes are available. Visit our programmes page or reach out via the booking form to discuss the right option for your goals.',
    },
    {
        q: 'How are vegetarian and vegan diets accommodated?',
        a: 'Absolutely — vegetarian, vegan, eggetarian, and other dietary preferences are fully accommodated. Your plan is built around what you actually eat and enjoy.',
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

export default function IndiaPage() {
    return (
        <LocationPageShell
            breadcrumbs={[
                { name: 'Home', url: '/' },
                { name: 'Dietitian in India', url: '/india/' },
            ]}
            faqJsonLd={faqJsonLd}
            hero={{
                eyebrow: 'Serving India · Online Consultations',
                h1: 'Online Dietitian in India',
                body: 'Access expert clinical nutrition support from anywhere in India. Dt. Sabah Ghare designs personalised diet plans built around your regional food preferences, lifestyle, and health goals — no one-size-fits-all templates.',
                primaryCta: { href: '/checkout', label: 'Start Your Nutrition Journey' },
                secondaryCta: { href: '/program', label: 'View Programmes' },
            }}
            intro={{
                eyebrow: 'Who We Serve',
                heading: 'Expert Nutrition Guidance for Every Corner of India',
                paragraphs: [
                    'India is a country of diverse cuisines, lifestyles, and health challenges. From urban professionals in Bengaluru managing weight gain from sedentary office routines, to mothers in smaller cities seeking evidence-based support for PCOS or gestational nutrition — the need for qualified dietitian guidance is universal, but access has historically been limited by geography.',
                    'The Diet Cascade changes that. Founded by Dt. Sabah Ghare — a clinical dietitian with a master\'s in clinical nutrition and an IFSA-certified fitness coaching background — the clinic operates entirely online, making personalised, professional nutrition support accessible to clients across India without the need to travel or attend a clinic.',
                    'With over 5,000 clients served and 10,000+ personalised plans created, TDC has developed a methodology that genuinely works for Indian bodies, Indian foods, and Indian lifestyles. Plans account for regional cuisine, vegetarian preferences, festival seasons, family cooking dynamics, and budget — because real nutrition has to fit your real life.',
                ],
            }}
            services={[
                {
                    icon: Scale,
                    title: 'Weight Loss',
                    description: 'Science-based weight loss tailored to your metabolism and Indian dietary habits. Sustainable, not restrictive.',
                    href: '/regimens',
                },
                {
                    icon: Dumbbell,
                    title: 'Body Transformation',
                    description: 'Nutrition plans for fat loss, muscle gain, and body recomposition — coordinated with your fitness routine.',
                    href: '/regimens',
                },
                {
                    icon: Activity,
                    title: 'PCOS Management',
                    description: 'Specialist dietary support for women managing PCOS — focused on hormonal balance and sustainable weight management.',
                    href: '/regimens',
                },
                {
                    icon: Baby,
                    title: 'Pregnancy & Postnatal Nutrition',
                    description: 'Nutritional guidance for expectant and new mothers, emphasising well-being throughout the journey.',
                    href: '/regimens',
                },
                {
                    icon: Stethoscope,
                    title: 'Therapeutic Nutrition',
                    description: 'Diet plans for managing metabolic and clinical conditions — based on your blood reports and medical background.',
                    href: '/regimens',
                },
                {
                    icon: Globe,
                    title: 'Weight Gain & Muscle Building',
                    description: 'For underweight individuals or those focused on building strength — structured nutrition to support healthy weight gain.',
                    href: '/regimens',
                },
            ]}
            locationSection={{
                eyebrow: 'India-Specific Approach',
                heading: 'Diet Plans Built for Indian Life',
                body: [
                    'A nutrition plan that ignores your cultural food context will not stick. Indian dietary habits are rich, varied, and deeply rooted in family, tradition, and region. At The Diet Cascade, plans are built with this reality in mind.',
                    'Whether you eat dal-chawal, idli-sambar, roti-sabzi, or a mix depending on the season — your plan will incorporate the foods you already know and enjoy. Festive seasons, weddings, travel, and dining out are all accounted for with practical guidance rather than rigid rules.',
                    'The online consultation format is particularly well-suited to India\'s geography. Clients from Tier 1, Tier 2, and Tier 3 cities — from Jaipur to Kochi, from Ahmedabad to Guwahati — can access the same quality of nutrition support as someone in Navi Mumbai.',
                ],
            }}
            howItWorks={[
                { step: '1', title: 'Book Your Consultation', description: 'Fill in the booking form with your name, contact number, and primary health goal.' },
                { step: '2', title: 'Health & Diet Assessment', description: 'Share your health history, blood reports (if available), current dietary habits, and daily schedule for a comprehensive review.' },
                { step: '3', title: 'Personalised Plan Delivery', description: 'Receive a customised Indian meal plan with recipes, quantities, and a supplement assessment — tailored to your preferences and goals.' },
                { step: '4', title: 'WhatsApp Meal Monitoring', description: 'Stay connected between sessions via WhatsApp — share meals, ask questions, and receive real-time guidance.' },
                { step: '5', title: 'Progress Reviews', description: 'Scheduled check-in calls to review weight, measurements, energy, and overall progress — with plan adjustments as needed.' },
            ]}
            whyTDC={[
                { title: 'Indian Food, Always', description: 'No Westernised templates. Every plan is built around Indian ingredients, regional cuisine, and cooking habits you can sustain.' },
                { title: 'Accessible from Any City', description: 'Online-first model means clients from any state, city, or town across India can access the same level of care.' },
                { title: 'Clinical Foundation', description: 'Dt. Sabah holds a master\'s in clinical nutrition and reviews blood reports as part of the assessment process.' },
                { title: 'No Supplements Pushed', description: 'Whole food nutrition first. Supplements are only suggested when clinically indicated — not as a default upsell.' },
                { title: 'Ongoing WhatsApp Support', description: 'Real support between sessions — not just a PDF plan and a goodbye.' },
                { title: 'Flexible Programme Duration', description: '1-month, 3-month, or 6-month programmes to match your goals and commitment level.' },
            ]}
            faqs={faqs}
            ctaSection={{
                heading: 'Start Your Nutrition Journey from Anywhere in India',
                sub: 'Personalised, evidence-informed diet plans built for Indian food, Indian life. Book your consultation today.',
                primaryLabel: 'Book a Consultation',
            }}
        />
    );
}
