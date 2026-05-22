import { getSeoMetadata } from '@/utils/getSeoMetadata';

export async function generateMetadata() {
    return getSeoMetadata('/share-story', {
        title: 'Share Your Story | The Diet Cascade',
        description: 'Inspired by your transformation? Share your journey with The Diet Cascade community and motivate others to start their health and wellness path.',
        keywords: 'share transformation story, diet success story, weight loss journey, diet cascade testimonial',
    });
}

const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thedietcascade.com/' },
        { '@type': 'ListItem', position: 2, name: 'Share Your Story', item: 'https://thedietcascade.com/share-story' },
    ],
});

export default function ShareStoryLayout({ children }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
            {children}
        </>
    );
}

