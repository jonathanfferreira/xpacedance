import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xpace.on';

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/explore',
                    '/course/',
                ],
                disallow: [
                    '/dashboard/',
                    '/studio/',
                    '/master/',
                    '/api/',
                    '/checkout/',
                    '/dashboard/os/',
                ],
            },
            {
                // Bloqueia bots de IA de treinar com o conteúdo pago
                userAgent: ['GPTBot', 'Google-Extended', 'CCBot', 'anthropic-ai'],
                disallow: '/',
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
