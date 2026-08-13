import LocationPageShell from '@/components/location/LocationPageShell';
import {
    Scale, Activity, Heart, Baby, Stethoscope, Dumbbell, Leaf, Globe, MessageCircle,
} from 'lucide-react';

export const revalidate = 518400;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

export async function generateMetadata() {
    return {
        title: 'Dietitian in Navi Mumbai | Clinical Nutrition & Weight Management — The Diet Cascade',
        description: 'Consult a certified clinical dietitian in Navi Mumbai. Dt. Sabah Ghare offers personalised diet plans for weight loss, PCOS, body transformation, and more — online and in-person.',
        keywords: 'dietitian in navi mumbai, nutritionist navi mumbai, weight loss dietitian navi mumbai, clinical dietitian navi mumbai, PCOS dietitian navi mumbai, personalized diet plan navi mumbai, online dietitian navi mumbai',
        alternates: { canonical: `${BASE}/dietitian-navi-mumbai/` },
        openGraph: {
            title: 'Dietitian in Navi Mumbai | The Diet Cascade',
            description: 'Personalised clinical nutrition in Navi Mumbai. Customised diet plans for weight loss, PCOS, pregnancy, and healthy living — by Dt. Sabah Ghare.',
            url: `${BASE}/dietitian-navi-mumbai/`,
            images: [{ url: `${BASE}/images/logo.png`, width: 1200, height: 630, alt: 'The Diet Cascade — Dietitian in Navi Mumbai' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'Dietitian in Navi Mumbai | The Diet Cascade',
            description: 'Personalised nutrition plans in Navi Mumbai by certified clinical dietitian Dt. Sabah Ghare.',
        },
    };
}

// ── FAQ structured data ──────────────────────────────────────────────────────
const faqs = [
    {
        q: 'Is The Diet Cascade a dietitian clinic based in Navi Mumbai?',
        a: 'Yes. The Diet Cascade is rooted in Nerul, Navi Mumbai. Our founder Dt. Sabah Ghare is a clinical dietitian based here, and also serves clients online across India and internationally.',
    },
    {
        q: 'Do you offer in-person dietitian consultations in Navi Mumbai?',
        a: 'While our primary consultation mode is online (which provides flexibility and ongoing support), Dt. Sabah Ghare is a visiting dietitian in various healthcare clinics in the Navi Mumbai area. Reach out via the contact page to enquire about current availability.',
    },
    {
        q: 'Can I get a personalised Indian diet plan tailored to my food preferences?',
        a: 'Absolutely. Every plan is built around your food preferences, cooking style, health goals, schedule, and cultural dietary habits. We do not follow generic templates.',
    },
    {
        q: 'What health goals can a dietitian in Navi Mumbai help with?',
        a: 'Dt. Sabah Ghare supports weight loss, weight gain, body transformation, PCOS management, gestational and postnatal nutrition, therapeutic nutrition for medical conditions, and general wellness.',
    },
    {
        q: 'Do you offer online consultations for Navi Mumbai residents?',
        a: 'Yes. Most clients prefer our online consultation format — it allows for regular follow-ups, meal monitoring via WhatsApp, and progress tracking without the need to travel.',
    },
    {
        q: 'How do I book a consultation?',
        a: 'Visit our booking page and submit your details. Our team will connect with you via WhatsApp to schedule your first consultation and discuss your goals.',
    },
    {
        q: 'Can a supplement-free diet plan really work?',
        a: 'Yes — our plans are designed to be supplement-free wherever possible, using whole foods and balanced macronutrient distribution to meet your nutritional needs naturally.',
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

// ── Local Business structured data (physical presence confirmed in Navi Mumbai) ──
const localBizJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'The Diet Cascade',
    url: BASE,
    telephone: '+919004491160',
    email: 'sabahghare24@gmail.com',
    address: {
        '@type': 'PostalAddress',
        addressLocality: 'Nerul',
        addressRegion: 'Navi Mumbai',
        addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 19.0359, longitude: 73.0297 },
    priceRange: '$$',
    medicalSpecialty: 'Dietetics',
    employee: {
        '@type': 'Person',
        name: 'Dt. Sabah Ghare',
        jobTitle: 'Clinical Dietitian & Lifestyle Coach',
        url: `${BASE}/about`,
    },
};

export default function NaviMumbaiPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizJsonLd) }}
            />
            <LocationPageShell
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Dietitian in Navi Mumbai', url: '/dietitian-navi-mumbai/' },
                ]}
                faqJsonLd={faqJsonLd}
                hero={{
                    eyebrow: 'Navi Mumbai · Clinical Nutrition',
                    h1: 'Dietitian in Navi Mumbai',
                    body: 'Personalised nutrition support from a certified clinical dietitian rooted in Navi Mumbai. Whether your goal is weight loss, managing a health condition, or building a sustainable lifestyle — we design a plan that actually fits your life.',
                    primaryCta: { href: '/checkout', label: 'Book a Consultation' },
                    secondaryCta: { href: '/about', label: 'Meet Dt. Sabah' },
                }}
                intro={{
                    eyebrow: 'About the Service',
                    heading: 'Clinical Nutrition Support, Close to Home',
                    paragraphs: [
                        'The Diet Cascade is a holistic nutrition clinic founded and led by Dt. Sabah Ghare — a clinical dietitian, lifestyle coach, and certified fitness professional based in Nerul, Navi Mumbai. With over 5,000 clients served across 8+ countries and more than 10,000 personalised diet plans created, the clinic has built a strong track record of helping people achieve meaningful, lasting health outcomes.',
                        'For residents of Navi Mumbai — whether in Nerul, Vashi, Belapur, Kharghar, or Panvel — access to a qualified clinical dietitian is now straightforward. Online consultations make it easy to begin from home, while Dt. Sabah Ghare also works as a visiting dietitian in various healthcare clinics in the area, making in-person appointments possible on a case-by-case basis.',
                        'Nutrition plans at TDC are never generic. Every plan is built around your health history, blood reports, daily schedule, food preferences, and realistic goals — with ongoing support via WhatsApp so adjustments can be made in real time.',
                    ],
                }}
                services={[
                    {
                        icon: Scale,
                        title: 'Weight Loss',
                        description: 'Sustainable, science-backed weight loss plans designed around your metabolism, lifestyle, and food preferences. No crash diets.',
                        href: '/regimens',
                    },
                    {
                        icon: Dumbbell,
                        title: 'Body Transformation',
                        description: 'Customised nutrition for fat loss, muscle gain, and body composition improvement — built in sync with your exercise routine.',
                        href: '/regimens',
                    },
                    {
                        icon: Activity,
                        title: 'PCOS Nutrition',
                        description: 'Diet plans designed to support hormonal balance and weight management for women living with PCOS.',
                        href: '/regimens',
                    },
                    {
                        icon: Baby,
                        title: 'Gestational & Postnatal',
                        description: 'Nutritional care for expectant and new mothers — focused on well-being, not weight pressure.',
                        href: '/regimens',
                    },
                    {
                        icon: Stethoscope,
                        title: 'Therapeutic Nutrition',
                        description: 'Diet management for metabolic conditions and clinical health concerns, guided by blood report analysis.',
                        href: '/regimens',
                    },
                    {
                        icon: Leaf,
                        title: 'Supplement-Free Plans',
                        description: 'All plans are designed to meet nutritional needs through whole foods wherever possible, without unnecessary supplements.',
                    },
                ]}
                locationSection={{
                    eyebrow: 'Serving Navi Mumbai',
                    heading: 'Local Expertise, Flexible Access',
                    body: [
                        'Navi Mumbai is a planned city with a rapidly growing health-conscious population. Yet finding a qualified clinical dietitian who truly understands Indian dietary habits, local food culture, and the pressures of modern urban life can be a challenge.',
                        'The Diet Cascade bridges that gap. Our consultations are available online — giving Navi Mumbai residents flexibility without needing to commute — and Dt. Sabah Ghare maintains a visiting presence at select healthcare clinics in the region for those who prefer a face-to-face appointment.',
                        'Our meal plans are built around Indian cuisine: dal, sabzi, roti, rice, regional flavours, and local produce. You will not be asked to follow a Western diet template or purchase expensive imported foods.',
                    ],
                }}
                howItWorks={[
                    { step: '1', title: 'Submit Your Details', description: 'Visit our booking page and share your name, contact, and the health goal you want to work towards.' },
                    { step: '2', title: 'Initial Assessment Call', description: 'Dt. Sabah reviews your diet history, blood reports if available, lifestyle, and medical background before your first session.' },
                    { step: '3', title: 'Receive Your Personalised Plan', description: 'A fully customised meal plan with recipes, shopping guidance, and a supplement assessment is prepared for you.' },
                    { step: '4', title: 'Ongoing Monitoring', description: 'Progress is tracked via WhatsApp — meal check-ins, weight and measurement updates, and photo tracking keep you accountable.' },
                    { step: '5', title: 'Regular Follow-Up Calls', description: 'Scheduled progress calls allow us to review results and adjust your plan based on how your body is responding.' },
                ]}
                whyTDC={[
                    { title: 'Clinically Trained Dietitian', description: 'Dt. Sabah Ghare holds a master\'s in clinical nutrition and an advanced exercise physiology certification — your plan is evidence-informed.' },
                    { title: 'Indian Food, Real Life', description: 'Plans are built around Indian foods and cooking habits — no unrealistic dietary restrictions that don\'t fit your culture or budget.' },
                    { title: '5000+ Clients Served', description: 'A growing community of clients across Navi Mumbai, India, and 8+ countries trusts TDC for personalised nutrition support.' },
                    { title: 'No Unnecessary Supplements', description: 'The Diet Cascade is designed to nourish through food first. Supplements are only recommended when clinically indicated.' },
                    { title: 'WhatsApp Support', description: 'Between sessions, you have direct access via WhatsApp for meal tracking, questions, and real-time guidance.' },
                    { title: 'Flexible Plans — 1, 3, or 6 Months', description: 'Choose a programme duration that matches your goals: a focused Starter, a Momentum programme, or a full Transformation journey.' },
                ]}
                faqs={faqs}
                ctaSection={{
                    heading: 'Ready to Work with a Dietitian in Navi Mumbai?',
                    sub: 'Book your first consultation with The Diet Cascade and take a structured, supported step towards your health goals.',
                    primaryLabel: 'Book a Consultation',
                }}
            />
        </>
    );
}
