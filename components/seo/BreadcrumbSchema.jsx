/**
 * BreadcrumbSchema
 * Renders a Schema.org BreadcrumbList as an inline JSON-LD script tag.
 *
 * Usage:
 *   <BreadcrumbSchema items={[
 *     { name: 'Home', url: '/' },
 *     { name: 'Blog', url: '/blog' },
 *     { name: post.title, url: `/blog/${slug}` },
 *   ]} />
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

export default function BreadcrumbSchema({ items = [] }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
