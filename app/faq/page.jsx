import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FAQClient from './FAQClient';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';

export const revalidate = 259200; // 3 days in seconds

export async function generateMetadata() {
    const supabase = await createClient();
    let title = 'Frequently Asked Questions | The Diet Cascade';
    let description = 'Find answers to common questions about customized diet plans, pricing, online consultations, and how to work with Dt. Sabah Ghare.';
    let keywords = 'faq, frequently asked questions, diet cascade faq, sabah ghare diet plans, pcos diet cost';

    try {
        const { data: seo } = await supabase
            .from('seo_metadata')
            .select('*')
            .eq('route', '/faq')
            .single();

        if (seo) {
            title = seo.title || title;
            description = seo.description || description;
            keywords = seo.keywords || keywords;
        }
    } catch (err) {
        console.warn('Could not load SEO metadata for /faq from database. Using default fallback.', err);
    }

    return {
        title,
        description,
        keywords,
    };
}

export default async function FAQPage() {
    const supabase = await createClient();
    let initialFAQs = [];

    try {
        const { data, error } = await supabase
            .from('chatbot_faqs')
            .select('*')
            .order('id');

        if (!error && data) {
            initialFAQs = data;
        }
    } catch (err) {
        console.error('Failed to load FAQs for public FAQ page:', err);
    }

    return (
        <main className="bg-surface min-h-screen selection:bg-primary selection:text-white">
            <BreadcrumbSchema items={[
                { name: 'Home', url: '/' },
                { name: 'FAQ', url: '/faq' },
            ]} />
            <Navbar />
            <FAQClient initialFAQs={initialFAQs} />
            <Footer />
        </main>
    );
}
