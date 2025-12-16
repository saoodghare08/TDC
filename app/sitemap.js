import { createClient } from '@/utils/supabase/server';

export const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

export default async function sitemap() {
    const supabase = await createClient();
    const { data: posts } = await supabase
        .from('posts')
        .select('slug, updated_at')
        .eq('published', true);

    const blogRoutes = posts?.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at || new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.7,
    })) || [];

    const routes = ['', '/admin', '/blog', '/login', '/share-story'].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: route === '' ? 1 : 0.8,
    }));

    return [...routes, ...blogRoutes];
}
