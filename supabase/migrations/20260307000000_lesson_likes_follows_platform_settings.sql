-- Sprint 3: lesson_likes, follows, platform_settings, lesson_ratings, reports

-- 1. Adiciona likes_count na tabela lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 0;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url text;

-- 2. lesson_likes
CREATE TABLE IF NOT EXISTS public.lesson_likes (
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id   uuid NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (lesson_id, user_id)
);

ALTER TABLE public.lesson_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own likes"
    ON public.lesson_likes
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read likes"
    ON public.lesson_likes
    FOR SELECT
    TO authenticated
    USING (true);

-- RPC increment_lesson_likes
CREATE OR REPLACE FUNCTION public.increment_lesson_likes(l_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
    UPDATE public.lessons
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = l_id;
$$;

-- RPC decrement_lesson_likes
CREATE OR REPLACE FUNCTION public.decrement_lesson_likes(l_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
    UPDATE public.lessons
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = l_id;
$$;

-- 3. follows
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own follows"
    ON public.follows
    FOR ALL
    TO authenticated
    USING (follower_id = auth.uid())
    WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Anyone can read follows"
    ON public.follows
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key        text PRIMARY KEY,
    value      text NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage platform_settings"
    ON public.platform_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. lesson_ratings
CREATE TABLE IF NOT EXISTS public.lesson_ratings (
    lesson_id  uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
    rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (lesson_id, user_id)
);

ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ratings"
    ON public.lesson_ratings
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. reports
CREATE TABLE IF NOT EXISTS public.reports (
    id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id  uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason     text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert reports"
    ON public.reports
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read reports"
    ON public.reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );
