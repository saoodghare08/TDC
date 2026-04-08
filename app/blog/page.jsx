import { createClient } from '@/utils/supabase/server';
export const revalidate = 518400; // 6 days
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import { Calendar, ChevronRight } from 'lucide-react';

export async function generateMetadata() {
    const supabase = await createClient();
    const { data: seo } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('route', '/blog')
        .single();

    return {
        title: seo?.title || 'Blog | The Diet Cascade',
        description: seo?.description || 'Latest health tips, recipes, and insights from Dt. Sabah Ghare.',
        keywords: seo?.keywords || 'blog, health tips, recipes, diet advice',
    };
}

export default async function BlogIndexPage() {
    const supabase = await createClient();
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

    return (
        <main className="bg-surface min-h-screen">
            <Navbar />

            {/* Header */}
            <div className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-heading rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
                
                <div className="relative z-10 px-6 max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Our <span className="text-primary-200">Insights</span>
                    </h1>
                    <p className="text-white/60 max-w-xl mx-auto text-base md:text-xl font-light leading-relaxed">
                        Expert nutrition advice, wellness strategies, and healthy recipes curated for your lifestyle.
                    </p>
                </div>
            </div>

            <Section id="posts" className="bg-surface pb-24">
                {!posts || posts.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm">
                        <p className="text-para font-medium italic">New insights are being drafted. Check back shortly!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {posts.map((post) => (
                            <Link href={`/blog/${post.slug}`} key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-heading/5 transition-shadow duration-300 active:scale-[0.98]">
                                <div className="relative h-60 md:h-72 w-full overflow-hidden">
                                    {post.cover_image ? (
                                        <Image
                                            src={post.cover_image}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-surface flex items-center justify-center text-para/20 font-heading font-black text-4xl">TDC</div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-sm text-heading text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                            <Calendar size={12} className="text-primary" />
                                            {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 md:p-8 flex-1 flex flex-col">
                                    <h2 className="text-xl md:text-2xl font-heading font-bold text-heading mb-4 group-hover:text-primary transition-colors leading-snug">
                                        {post.title}
                                    </h2>
                                    <p className="text-para text-sm md:text-base mb-6 line-clamp-3 flex-1 leading-relaxed">{post.excerpt}</p>
                                    <div className="flex items-center gap-2 text-primary text-xs md:text-sm font-bold uppercase tracking-widest mt-auto">
                                        Access Insight
                                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Section>

            <Footer />
        </main>
    );
}
