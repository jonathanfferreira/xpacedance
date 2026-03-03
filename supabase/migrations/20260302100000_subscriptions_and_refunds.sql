-- Sprint 20: Commerce Engine v2 — Subscriptions + Refund statuses + Split audit

-- ========================================================
-- 1. SUBSCRIPTION PLANS (tenant-level plans)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL CHECK (price >= 19.90),
    cycle text NOT NULL DEFAULT 'MONTHLY' CHECK (cycle IN ('MONTHLY', 'YEARLY')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscription_plans_tenant ON public.subscription_plans(tenant_id);
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(tenant_id, is_active);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Tenant owner can manage their plans
CREATE POLICY "Tenant owner manages subscription plans"
    ON public.subscription_plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants
            WHERE tenants.id = tenant_id
              AND tenants.owner_id = auth.uid()
        )
    );

-- Anyone can read active plans (for public store pages)
CREATE POLICY "Public can read active plans"
    ON public.subscription_plans FOR SELECT
    USING (is_active = true);

-- ========================================================
-- 2. SUBSCRIPTIONS (user-level subscriptions)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    asaas_subscription_id text UNIQUE,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'CANCELED', 'PAST_DUE')),
    current_period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_asaas_id ON public.subscriptions(asaas_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(user_id, status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- User can read their own subscriptions
CREATE POLICY "User reads own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Tenant owner reads subscriptions of their tenant
CREATE POLICY "Tenant owner reads tenant subscriptions"
    ON public.subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants
            WHERE tenants.id = tenant_id
              AND tenants.owner_id = auth.uid()
        )
    );

-- ========================================================
-- 3. EXTEND TRANSACTIONS — new refund/chargeback statuses
-- ========================================================
ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_status_check
    CHECK (status IN (
        'pending', 'confirmed', 'overdue', 'cancelled', 'mock',
        'refunded', 'chargeback', 'refund_pending'
    ));

-- ========================================================
-- 4. SPLIT AUDIT TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.split_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
    professor_wallet_id text,
    professor_amount numeric(10,2) NOT NULL,
    platform_amount numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    split_percent numeric(5,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_split_audit_transaction ON public.split_audit(transaction_id);

ALTER TABLE public.split_audit ENABLE ROW LEVEL SECURITY;

-- Admin can read split audit
CREATE POLICY "Admin reads split audit"
    ON public.split_audit FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Service role inserts (API routes)
CREATE POLICY "Service role inserts split audit"
    ON public.split_audit FOR INSERT
    WITH CHECK (true);

-- ========================================================
-- 5. RPC: can_access_lesson — OR logic (enrollment OR subscription)
-- ========================================================
CREATE OR REPLACE FUNCTION public.can_access_lesson(p_user_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_course_id uuid;
    v_tenant_id uuid;
    v_has_enrollment boolean;
    v_has_subscription boolean;
BEGIN
    -- Get course and tenant for this lesson
    SELECT l.course_id, c.tenant_id
    INTO v_course_id, v_tenant_id
    FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = p_lesson_id;

    IF v_course_id IS NULL THEN
        RETURN false;
    END IF;

    -- (A) Check active enrollment for this specific course
    SELECT EXISTS(
        SELECT 1 FROM public.enrollments
        WHERE user_id = p_user_id
          AND course_id = v_course_id
          AND status = 'active'
    ) INTO v_has_enrollment;

    IF v_has_enrollment THEN
        RETURN true;
    END IF;

    -- (B) Check active subscription for the tenant that owns the course
    SELECT EXISTS(
        SELECT 1 FROM public.subscriptions
        WHERE user_id = p_user_id
          AND tenant_id = v_tenant_id
          AND status = 'ACTIVE'
          AND (current_period_end IS NULL OR current_period_end > now())
    ) INTO v_has_subscription;

    RETURN v_has_subscription;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.can_access_lesson(uuid, uuid) TO authenticated;
