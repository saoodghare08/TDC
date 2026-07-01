import { createClient } from '@supabase/supabase-js';

export const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

// Regenerate the sitemap at most once per day so new blog posts appear promptly
export const revalidate = 86400;

export default async function sitemap() {
    // Use the plain JS client here — the SSR helper calls cookies() which is
    // not available in the sitemap route (no request context).
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Build hreflang alternates for a given URL — same content, multiple regional targets
    const buildAlternates = (url) => ({
        languages: {
            'en-IN': url,
            'en-AE': url,
            'en-US': url,
            'en-GB': url,
            'en-CA': url,
            'en-AU': url,
            'x-default': url,
        },
    });

    const { data: posts } = await supabase
        .from('posts')
        .select('slug, created_at')
        .eq('published', true);

    const blogRoutes = posts?.map((post) => {
        const url = `${baseUrl}/blog/${post.slug}`;
        return {
            url,
            lastModified: post.created_at || new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.7,
            alternates: buildAlternates(url),
        };
    }) || [];

    // Only public-facing pages — keep /admin, /login, /portal out of index
    const routes = ['', '/about', '/blog', '/contact', '/faq', '/program',
        '/regimen', '/regimens', '/share-story', '/testimonials', '/privacy', '/terms'].map((route) => {
            const url = `${baseUrl}${route}`;
            return {
                url,
                lastModified: new Date().toISOString(),
                changeFrequency: 'monthly',
                priority: route === '' ? 1 : 0.8,
                alternates: buildAlternates(url),
            };
        });

    return [...routes, ...blogRoutes];
}
