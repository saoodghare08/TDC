import { createClient } from '@/utils/supabase/server';
export const revalidate = 518400; // 6 days
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';

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
        <main className="bg-white min-h-screen">
            <Navbar />

            {/* Header */}
            <div className="bg-heading text-white pt-40 pb-20 px-6 text-center rounded-b-[3rem]">
                <h1 className="text-5xl font-heading font-bold mb-4">Our Blog</h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Expert insights on nutrition, wellness, and healthy living.
                </p>
            </div>

            <Section id="posts" className="bg-white">
                {!posts || posts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>No posts published yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link href={`/blog/${post.slug}`} key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="relative h-64 w-full overflow-hidden">
                                    {post.cover_image ? (
                                        <Image
                                            src={post.cover_image}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">TDC</div>
                                    )}
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h2 className="text-2xl font-heading font-bold text-heading mb-3 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-600 mb-6 line-clamp-3 flex-1">{post.excerpt}</p>
                                    <span className="text-primary font-bold text-sm uppercase tracking-wider">Read More &rarr;</span>
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
