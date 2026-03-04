import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';

    // Remove porta para comparação (dev local: localhost:3000)
    const domain = hostname.replace(/:\d+$/, '');

    // Lista de domínios internos da plataforma (sem resolução customizada)
    const internalDomains = [
        'localhost',
        'xtage.app',
        'www.xtage.app',
        'xpaceon.vercel.app',
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/https?:\/\//, '') || '',
    ].filter(Boolean);

    const isInternalDomain = internalDomains.some(
        d => domain === d || domain.endsWith(`.${d}`)
    );

    // Domínio customizado → tenta resolver tenant
    if (!isInternalDomain) {
        const response = await resolveCustomDomain(request, domain);
        if (response) return response;
    }

    // Comportamento padrão: atualiza sessão Supabase
    return await updateSession(request);
}

/**
 * Resolve um domínio customizado para o slug do tenant.
 * Redireciona /caminho → /[slug]/caminho via rewrite interno.
 */
async function resolveCustomDomain(
    request: NextRequest,
    domain: string
): Promise<NextResponse | null> {
    try {
        // Cria cliente Supabase anônimo (sem cookies, read-only)
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => [] } }
        );

        // Busca tenant pelo domínio verificado
        const { data } = await supabase
            .from('tenant_domains')
            .select('tenant_id, tenants!tenant_id(slug)')
            .eq('domain', domain)
            .eq('verified', true)
            .single();

        const slug = (data as any)?.tenants?.slug;
        if (!slug) return null;

        // Rewrite: mantém URL original para o usuário mas roteia internamente
        const url = request.nextUrl.clone();
        const originalPath = url.pathname;

        // Raiz do domínio → vitrine do tenant
        if (originalPath === '/' || originalPath === '') {
            url.pathname = `/${slug}`;
        } else {
            // Outros caminhos: injeta o slug no prefix
            url.pathname = `/${slug}${originalPath}`;
        }

        const response = NextResponse.rewrite(url);
        // Injeta header para o layout saber qual tenant está ativo
        response.headers.set('x-tenant-slug', slug);
        return response;

    } catch {
        // Erro de resolução → deixa prosseguir normalmente
        return null;
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
