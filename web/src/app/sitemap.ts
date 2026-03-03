import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 3600; // Recria sitemap a cada 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xpace.on';
    const supabase = await createClient();

    // Busca todos os cursos publicados
    const { data: courses } = await supabase
        .from('courses')
        .select('id, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false });

    // Busca vitrines de tenants ativos
    const { data: tenants } = await supabase
        .from('tenants')
        .select('slug, updated_at')
        .eq('status', 'active')
        .not('slug', 'is', null);

    const courseUrls: MetadataRoute.Sitemap = (courses || []).map(course => ({
        url: `${siteUrl}/course/${course.id}`,
        lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    const tenantUrls: MetadataRoute.Sitemap = (tenants || []).map(tenant => ({
        url: `${siteUrl}/${tenant.slug}`,
        lastModified: tenant.updated_at ? new Date(tenant.updated_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
    }));

    const staticUrls: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${siteUrl}/explore`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/seja-parceiro`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${siteUrl}/termos`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${siteUrl}/privacidade`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    return [...staticUrls, ...tenantUrls, ...courseUrls];
}
