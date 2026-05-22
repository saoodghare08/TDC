import { baseUrl } from './sitemap';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/portal/', '/login/', '/checkout/', '/private/'],
            },
        ],

        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
