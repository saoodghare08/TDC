import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const supabase = await createClient();
    const { slug } = await params;
    const route = `/blog/${slug}`;

    // Parallel fetch for simplified performance
    const [
        { data: seo },
        { data: post }
    ] = await Promise.all([
        supabase.from('seo_metadata').select('*').eq('route', route).single(),
        supabase.from('posts').select('title, excerpt, cover_image').eq('slug', slug).single()
    ]);

    if (!post && !seo) return { title: 'Post Not Found' };

    // Priority: SEO Table > Post Data > Defaults
    return {
        title: seo?.title || (post?.title ? `${post.title} | The Diet Cascade` : 'The Diet Cascade'),
        description: seo?.description || post?.excerpt || 'Read this article on The Diet Cascade',
        keywords: seo?.keywords || "health, diet, nutrition, blog",
        openGraph: {
            title: seo?.title || post?.title,
            description: seo?.description || post?.excerpt,
            images: [seo?.image || post?.cover_image || '/images/logo.png']
        }
    };
}

export default async function BlogPostPage({ params }) {
    const supabase = await createClient();
    const { slug } = await params;
    const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!post) {
        notFound();
    }

    return (
        <main className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Header */}
            <div className="relative h-[60vh] w-full bg-heading">
                {post.cover_image && (
                    <Image src={post.cover_image} alt={post.title} fill className="object-cover opacity-50" priority />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end">
                    <div className="container mx-auto px-6 pb-20">
                        <Link href="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition">
                            <ChevronLeft size={20} /> Back to Blog
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4 leading-tight max-w-4xl">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-2 text-white/80">
                            <Calendar size={18} />
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Section className="bg-white">
                <div className="max-w-3xl mx-auto prose prose-lg prose-blue">
                    {/* 
               In a real app, you might use a markdown parser or HTML sanitizer here.
               Assuming content is stored as HTML or clean text for now.
            */}
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
            </Section>

            <Footer />
        </main>
    );
}
