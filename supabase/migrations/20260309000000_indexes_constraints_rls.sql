-- Sprint 5: Índices de performance, unique constraint e RLS faltando

-- ==============================
-- 1. Índices de performance ainda faltando
-- (os demais foram criados em 20260226100000)
-- ==============================

-- Consultas de studio e admin filtram cursos por tenant
CREATE INDEX IF NOT EXISTS idx_courses_tenant_id
    ON public.courses(tenant_id);

-- Consultas de progresso e player filtram aulas por curso
CREATE INDEX IF NOT EXISTS idx_lessons_course_id
    ON public.lessons(course_id);

-- Webhook e dashboard filtram matrículas por curso
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id
    ON public.enrollments(course_id);

-- Dashboard de XP e ranking filtram histórico por usuário
CREATE INDEX IF NOT EXISTS idx_user_xp_history_user_id
    ON public.user_xp_history(user_id);

-- Feed de comentários pode ser filtrado por autor
CREATE INDEX IF NOT EXISTS idx_comments_user_id
    ON public.comments(user_id);

-- ==============================
-- 2. Unique constraint em transactions.asaas_payment_id
-- Índice parcial para permitir NULL (PIX pendente ainda não tem ID)
-- Previne que o webhook processe o mesmo pagamento duas vezes
-- ==============================
CREATE UNIQUE INDEX IF NOT EXISTS uniq_transactions_asaas_payment_id
    ON public.transactions(asaas_payment_id)
    WHERE asaas_payment_id IS NOT NULL;

-- ==============================
-- 3. RLS: lesson_views sem política SELECT
-- Usuários precisam ler suas próprias views para calcular progresso
-- ==============================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'lesson_views' AND policyname = 'Users can read own lesson views'
    ) THEN
        CREATE POLICY "Users can read own lesson views"
            ON public.lesson_views
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());
    END IF;
END $$;

-- ==============================
-- 4. RLS: user_xp_history imutável
-- XP só pode ser inserido pelo sistema (service role), nunca editado ou deletado pelo usuário
-- ==============================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_xp_history' AND policyname = 'XP history is immutable'
    ) THEN
        CREATE POLICY "XP history is immutable"
            ON public.user_xp_history
            FOR UPDATE
            TO authenticated
            USING (false);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_xp_history' AND policyname = 'XP history cannot be deleted'
    ) THEN
        CREATE POLICY "XP history cannot be deleted"
            ON public.user_xp_history
            FOR DELETE
            TO authenticated
            USING (false);
    END IF;
END $$;
