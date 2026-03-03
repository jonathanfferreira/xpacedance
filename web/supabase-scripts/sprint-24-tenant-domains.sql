-- Sprint 24: Tenant Custom Domains
-- ==================================
-- Permite que cada escola use seu próprio domínio customizado
-- Ex: academia.seusite.com.br → resolve para o tenant correto

CREATE TABLE IF NOT EXISTS tenant_domains (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain         TEXT NOT NULL,          -- Ex: "academia.dancabr.com"
    is_primary     BOOLEAN NOT NULL DEFAULT false,
    verified       BOOLEAN NOT NULL DEFAULT false,
    verified_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(domain)
);

-- Índices para lookup rápido no middleware
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain   ON tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant   ON tenant_domains(tenant_id);

-- RLS: somente o owner do tenant pode ver seus domínios
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owner manages own domains"
    ON tenant_domains FOR ALL
    USING (
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

-- Função helper: retorna tenant_id para um domínio (chamada no middleware)
CREATE OR REPLACE FUNCTION get_tenant_by_domain(p_domain TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT tenant_id FROM tenant_domains
    WHERE domain = p_domain AND verified = true
    LIMIT 1;
$$;

-- Adiciona slug à tabela tenants se não existir
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#6324b2',
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Adiciona push_token e push_subscription à tabela users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS push_token TEXT,
    ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Índice para slug de tenant (lookup na vitrine pública)
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug) WHERE slug IS NOT NULL;
