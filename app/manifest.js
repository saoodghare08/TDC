export default function manifest() {
    return {
        name: 'The Diet Cascade',
        short_name: 'TDC',
        description: 'Clinical Dietitian & Lifestyle Coach - Personalized diet transformations.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/images/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/images/logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
