-- Pré-lançamento: Lista de espera
-- Coleta de leads antes do lançamento oficial em 29/03/2026

CREATE TABLE IF NOT EXISTS public.waitlist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    whatsapp    TEXT,
    type        TEXT NOT NULL DEFAULT 'aluno' CHECK (type IN ('aluno', 'criador')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(email)
);

-- Nenhuma RLS pública — inserção via service_role na API route
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Apenas admin lê (para o painel master exportar a lista)
CREATE POLICY "Admins can read waitlist"
    ON public.waitlist FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
