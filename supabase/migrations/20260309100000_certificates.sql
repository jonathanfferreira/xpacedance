-- Sprint 26: Certificados de Conclusão de Curso
-- ================================================
-- Emite um certificado único por usuário/curso quando todas as aulas são completadas

CREATE TABLE IF NOT EXISTS certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    public_slug     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
    completion_pct  SMALLINT NOT NULL DEFAULT 100,
    UNIQUE(user_id, course_id)
);

-- Índice para busca pública pelo slug
CREATE INDEX IF NOT EXISTS idx_certificates_slug    ON certificates(public_slug);
CREATE INDEX IF NOT EXISTS idx_certificates_user    ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course  ON certificates(course_id);

-- RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Aluno vê seus próprios certificados
CREATE POLICY "User sees own certificates"
    ON certificates FOR SELECT
    USING (user_id = auth.uid());

-- Qualquer um pode ler um certificado pelo slug (página pública de validação)
CREATE POLICY "Public read by slug"
    ON certificates FOR SELECT
    USING (true);

-- Somente service role pode inserir (via API route autenticada)
-- Logo: sem policy de INSERT para usuários comuns — a API usa service_role

-- Adiciona campo completed_at à tabela progress se não existir
ALTER TABLE progress
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Função: verifica se usuário completou 100% do curso e emite certificado
CREATE OR REPLACE FUNCTION emit_certificate_if_complete(
    p_user_id   UUID,
    p_course_id UUID
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_total_lessons     INT;
    v_completed_lessons INT;
    v_tenant_id         UUID;
    v_cert_id           UUID;
BEGIN
    -- Conta total de aulas do curso
    SELECT count(*) INTO v_total_lessons
    FROM lessons l
    JOIN course_modules cm ON l.module_id = cm.id
    WHERE cm.course_id = p_course_id;

    IF v_total_lessons = 0 THEN
        RETURN NULL;
    END IF;

    -- Conta aulas completadas pelo usuário neste curso
    SELECT count(*) INTO v_completed_lessons
    FROM progress pr
    JOIN lessons l ON pr.lesson_id = l.id
    JOIN course_modules cm ON l.module_id = cm.id
    WHERE pr.user_id = p_user_id
      AND cm.course_id = p_course_id
      AND pr.completed = true;

    IF v_completed_lessons < v_total_lessons THEN
        RETURN NULL;
    END IF;

    -- Busca tenant do curso
    SELECT tenant_id INTO v_tenant_id FROM courses WHERE id = p_course_id;

    -- Insere certificado (ignora se já existe)
    INSERT INTO certificates (user_id, course_id, tenant_id)
    VALUES (p_user_id, p_course_id, v_tenant_id)
    ON CONFLICT (user_id, course_id) DO NOTHING
    RETURNING id INTO v_cert_id;

    -- Retorna o ID do certificado (novo ou existente)
    IF v_cert_id IS NULL THEN
        SELECT id INTO v_cert_id FROM certificates
        WHERE user_id = p_user_id AND course_id = p_course_id;
    END IF;

    RETURN v_cert_id;
END;
$$;
