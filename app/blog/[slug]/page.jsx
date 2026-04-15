import { createClient } from '@/utils/supabase/server';
export const revalidate = 518400; // 6 days
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Section from '@/components/ui/Section';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Calendar, Share2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import ShareButton from '@/components/blog/ShareButton';

export async function generateMetadata({ params }) {
    const supabase = await createClient();
    const { slug } = await params;
    const route = `/blog/${slug}`;

    const [
        { data: seo },
        { data: post }
    ] = await Promise.all([
        supabase.from('seo_metadata').select('*').eq('route', route).single(),
        supabase.from('posts').select('title, excerpt, cover_image').eq('slug', slug).single()
    ]);

    if (!post && !seo) return { title: 'Post Not Found' };

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
        <main className="bg-surface min-h-screen">
            <Navbar />

            {/* Premium Blog Header */}
            <div className="relative h-[55vh] md:h-[50vh] w-full bg-heading overflow-hidden rounded-b-[2.5rem] md:rounded-b-[5rem]">
                {post.cover_image ? (
                    <Image 
                        src={post.cover_image} 
                        alt={post.title} 
                        fill 
                        className="object-cover opacity-60 md:opacity-70 scale-105" 
                        priority 
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-heading to-primary/20" />
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-heading via-heading/40 to-transparent" />

                <div className="absolute inset-0 flex items-end">
                    <div className="max-w-4xl mx-auto px-6 w-full pb-16 md:pb-24">
                        <Link href="/blog" className="inline-flex items-center gap-2 text-primary-200 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-8 text-white transition-colors group">
                            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            Insights Library
                        </Link>
                        
                        <h1 className="text-3xl md:text-6xl font-heading font-bold text-white mb-6 leading-[1.15] tracking-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 md:gap-8">
                            <div className="flex items-center gap-2.5 text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/5 py-2 px-4 rounded-full backdrop-blur-sm">
                                <Calendar size={14} className="text-primary" />
                                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-2.5 text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/5 py-2 px-4 rounded-full backdrop-blur-sm cursor-help">
                                <span className="text-primary font-black">TDC</span>
                                Verified Insight
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <Section className="relative z-10 -mt-10 md:-mt-16 pt-0">
                <div className="max-w-3xl mx-auto bg-white p-3 md:p-16 rounded-4xl md:rounded-[3rem] shadow-2xl shadow-heading/5 border border-gray-100">
                    <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none 
                        prose-headings:font-heading prose-headings:font-bold prose-headings:text-heading
                        prose-p:text-para prose-p:leading-relaxed
                        prose-strong:text-heading prose-strong:font-bold
                        prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-3xl prose-img:shadow-lg
                        prose-blockquote:border-l-primary prose-blockquote:bg-surface prose-blockquote:rounded-r-2xl prose-blockquote:py-2 prose-blockquote:font-medium
                    ">
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </article>

                    {/* Footer Actions */}
                    <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-heading font-black">
                                S
                            </div>
                            <div>
                                <p className="text-[10px] text-para font-bold uppercase tracking-widest">Authored By</p>
                                <p className="text-sm font-bold text-heading leading-none mt-1">Dt. Sabah Ghare</p>
                            </div>
                        </div>
                        
                        <ShareButton />
                    </div>
                </div>
            </Section>

            <Footer />
        </main>
    );
}
