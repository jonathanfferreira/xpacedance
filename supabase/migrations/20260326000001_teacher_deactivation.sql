-- Migration: suporte a downgrade de professor (soft deactivation)

-- 1. Colunas de desativação no tenant
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
    ADD COLUMN IF NOT EXISTS deactivation_reason text;

-- 2. Status de arquivamento de curso
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_status text NOT NULL DEFAULT 'active'
    CHECK (course_status IN ('active', 'archived', 'draft'));

-- 3. Índice para filtrar apenas cursos ativos na vitrine
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(course_status);
