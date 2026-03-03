-- Sprint 28: In-App Notifications
-- ================================================
-- Sistema de notificações realtime para usuários e tenants

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE, -- opcional, para saber de qual escola veio
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'revenue', 'achievement'
    link_url    TEXT, -- Ex: '/dashboard/conquistas' ou '/studio/analytics'
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para otimizar busca de notificações n lidas por usuário
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Usuário pode ler suas próprias notificações
CREATE POLICY "Users can read own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Usuário pode marcar como lida (update de 'read')
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Habilita Realtime na tabela para que o cliente receba via WebSocket
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Função utilitária (RPC) para criar notificação (útil para triggers ou APIs com service_role)
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id   UUID,
    p_title     TEXT,
    p_message   TEXT,
    p_type      TEXT DEFAULT 'info',
    p_link_url  TEXT DEFAULT NULL,
    p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_notif_id UUID;
BEGIN
    INSERT INTO notifications (user_id, tenant_id, title, message, type, link_url)
    VALUES (p_user_id, p_tenant_id, p_title, p_message, p_type, p_link_url)
    RETURNING id INTO v_notif_id;

    RETURN v_notif_id;
END;
$$;
