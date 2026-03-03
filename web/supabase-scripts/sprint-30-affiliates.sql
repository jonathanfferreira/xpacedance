-- Sprint 30: Afiliados e Sistema de Referral
-- ================================================
-- Tabelas para gerenciar revendedores (afiliados) e rastrear cliques/vendas

CREATE TABLE IF NOT EXISTS affiliates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    affiliate_code  TEXT NOT NULL UNIQUE, -- Ex: 'JOAO2024'
    commission_pct  NUMERIC(5,2) NOT NULL DEFAULT 15.00, -- 15%
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, tenant_id) -- Um user só pode ter 1 código de afiliado por tenant
);

-- Tabela para rastrear views (cliques no link) e conversões
CREATE TABLE IF NOT EXISTS referral_tracking (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    course_id       UUID REFERENCES courses(id) ON DELETE CASCADE, -- opcional, se foi link direto de curso
    visitor_id      TEXT, -- um hash de fingerprint ou ip (para contar unique clicks)
    converted       BOOLEAN NOT NULL DEFAULT false, -- virou venda?
    transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL, -- se converteu, qual foi a venda
    commission_amt  NUMERIC(10,2) DEFAULT 0.00, -- valor financeiro da comissão gerada (R$)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

-- Affiliates Policy: Usuário vê seus cadastros, Tenant vê seus afiliados
CREATE POLICY "Users can see own affiliate profile" ON affiliates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Tenant owners can see their affiliates" ON affiliates FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

-- Referral Tracking Policy: Usuário vê suas referências, Tenant vê as da sua escola
CREATE POLICY "Affiliates can see own referrals" ON referral_tracking FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant owners can see referrals in their tenant" ON referral_tracking FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_referral_affiliate ON referral_tracking(affiliate_id);
