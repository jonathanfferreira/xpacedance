-- Sprint 22: XP Scaling by Difficulty + User Streaks
-- =====================================================

-- 1. Add difficulty column to lessons
ALTER TABLE lessons
    ADD COLUMN IF NOT EXISTS difficulty TEXT
    DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'master'));

-- 2. Create user_streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INT  NOT NULL DEFAULT 0,
    longest_streak INT  NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- RLS: users can only see/update their own streak
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streak"
    ON user_streaks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. DB Function: update_streak(p_user_id)
-- Called from the API after XP award
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS TABLE(current_streak INT, longest_streak INT, is_new_record BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_today          DATE := CURRENT_DATE;
    v_last_activity  DATE;
    v_current        INT  := 0;
    v_longest        INT  := 0;
    v_is_new_record  BOOLEAN := FALSE;
BEGIN
    -- Get or create streak record
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 0, 0, NULL)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT us.current_streak, us.longest_streak, us.last_activity_date
    INTO v_current, v_longest, v_last_activity
    FROM user_streaks us
    WHERE us.user_id = p_user_id;

    -- Already updated today
    IF v_last_activity = v_today THEN
        RETURN QUERY SELECT v_current, v_longest, FALSE;
        RETURN;
    END IF;

    -- Consecutive day (yesterday) → increment
    IF v_last_activity = v_today - INTERVAL '1 day' THEN
        v_current := v_current + 1;
    ELSE
        -- Streak broken or first activity
        v_current := 1;
    END IF;

    -- Update longest record
    IF v_current > v_longest THEN
        v_longest := v_current;
        v_is_new_record := TRUE;
    END IF;

    -- Persist
    UPDATE user_streaks
    SET
        current_streak     = v_current,
        longest_streak     = v_longest,
        last_activity_date = v_today,
        updated_at         = now()
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT v_current, v_longest, v_is_new_record;
END;
$$;

-- 4. XP table: add difficulty reference to progress (optional metadata)
ALTER TABLE progress
    ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';

-- 5. Index for streak lookups
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON lessons(difficulty);
