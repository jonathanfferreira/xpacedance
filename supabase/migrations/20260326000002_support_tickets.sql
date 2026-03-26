-- Migration P4: tabela de tickets de suporte interno
-- Usada para rastrear chamados abertos no Crisp/Intercom internamente.

CREATE TABLE IF NOT EXISTS support_tickets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    external_id     text,                           -- ID do Crisp/Intercom
    status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
    category        text
                    CHECK (category IN ('billing', 'content', 'tech', 'account', 'other')),
    subject         text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    resolved_at     timestamptz,
    assigned_to     uuid REFERENCES auth.users(id) -- admin responsável
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user    ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status  ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Aluno vê apenas seus próprios tickets
CREATE POLICY "aluno_ver_proprios_tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Admin vê todos os tickets
CREATE POLICY "admin_ver_todos_tickets" ON support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Aluno pode criar ticket
CREATE POLICY "aluno_criar_ticket" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
