-- Database Performance Optimization Migration
-- Resolves "Auth RLS Initialization Plan" by wrapping auth.uid() in (select auth.uid())
-- Resolves "Unused Index" by dropping dead indexes
-- Resolves "Unindexed foreign keys" by creating missing indexes

------------------------------------------
-- 1. Unused Indexes (DROP)
------------------------------------------
DROP INDEX IF EXISTS idx_lesson_views_lesson_id;
DROP INDEX IF EXISTS idx_lesson_views_created_at;
DROP INDEX IF EXISTS idx_courses_is_promoted;

------------------------------------------
-- 2. Unindexed Foreign Keys (CREATE INDEX)
------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_tenant_id ON courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_user_id ON lesson_views(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson_id ON progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_course_id ON transactions(course_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_history_user_id ON user_xp_history(user_id);

------------------------------------------
-- 3. RLS Auth Initialization Plan Overrides
------------------------------------------

-- Table: enrollments
ALTER POLICY "Tenant owners can view student enrollments" ON enrollments USING (EXISTS ( SELECT 1 FROM (courses c JOIN tenants t ON ((t.id = c.tenant_id))) WHERE ((c.id = enrollments.course_id) AND (t.owner_id = (select auth.uid())))));
ALTER POLICY "Users can view own enrollments" ON enrollments USING (user_id = (select auth.uid()));

-- Table: progress
ALTER POLICY "Tenant owners can view student progress" ON progress USING (EXISTS ( SELECT 1 FROM ((lessons l JOIN courses c ON ((c.id = l.course_id))) JOIN tenants t ON ((t.id = c.tenant_id))) WHERE ((l.id = progress.lesson_id) AND (t.owner_id = (select auth.uid())))));
ALTER POLICY "Users can manage own progress" ON progress USING (user_id = (select auth.uid()));

-- Table: courses
ALTER POLICY "Tenant owners can manage their courses" ON courses USING (EXISTS ( SELECT 1 FROM tenants t WHERE ((t.id = courses.tenant_id) AND (t.owner_id = (select auth.uid())))));

-- Table: transactions
ALTER POLICY "Tenant owners can view course transactions" ON transactions USING (EXISTS ( SELECT 1 FROM (courses c JOIN tenants t ON ((t.id = c.tenant_id))) WHERE ((c.id = transactions.course_id) AND (t.owner_id = (select auth.uid())))));
ALTER POLICY "Users can view own transactions" ON transactions USING (user_id = (select auth.uid()));

-- Table: user_xp_history
ALTER POLICY "Users can insert their own XP" ON user_xp_history WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own XP history" ON user_xp_history USING ((select auth.uid()) = user_id);

-- Table: comments
ALTER POLICY "Users can delete their own comments" ON comments USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own comments" ON comments WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own comments" ON comments USING ((select auth.uid()) = user_id);

-- Table: lesson_views
ALTER POLICY "Users can insert own views" ON lesson_views WITH CHECK (user_id = (select auth.uid()));

-- Table: user_sessions
ALTER POLICY "Users can view own session tracking" ON user_sessions USING (user_id = (select auth.uid()));

-- Table: push_subscriptions
ALTER POLICY "Users can delete their own push sub" ON push_subscriptions USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own push sub" ON push_subscriptions WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own push sub" ON push_subscriptions USING ((select auth.uid()) = user_id);

-- Table: tenants
ALTER POLICY "Admins can delete tenants" ON tenants USING (EXISTS ( SELECT 1 FROM users WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin'::text))));
ALTER POLICY "Admins can manage all tenants" ON tenants USING (get_user_role((select auth.uid())) = 'admin'::text);
ALTER POLICY "Owners can manage their tenants" ON tenants USING ((select auth.uid()) = owner_id);
ALTER POLICY "Users can create their own tenant application" ON tenants WITH CHECK ((select auth.uid()) = owner_id);

-- Table: lessons
ALTER POLICY "Enrolled students can read lessons" ON lessons USING (EXISTS ( SELECT 1 FROM enrollments e WHERE ((e.course_id = lessons.course_id) AND (e.user_id = (select auth.uid())) AND (e.status = 'active'::text))));
ALTER POLICY "Tenant owners can manage lessons" ON lessons USING (EXISTS ( SELECT 1 FROM (courses c JOIN tenants t ON ((t.id = c.tenant_id))) WHERE ((c.id = lessons.course_id) AND (t.owner_id = (select auth.uid())))));

-- Table: users
ALTER POLICY "Admins can read all users" ON users USING (get_user_role((select auth.uid())) = 'admin'::text);
ALTER POLICY "Admins can update users" ON users USING (EXISTS ( SELECT 1 FROM users users_1 WHERE ((users_1.id = (select auth.uid())) AND (users_1.role = 'admin'::text))));
ALTER POLICY "Users can read own data" ON users USING ((select auth.uid()) = id);

-- Table: course_materials
ALTER POLICY "Course owners can manage materials" ON course_materials USING (EXISTS ( SELECT 1 FROM (courses c JOIN tenants t ON ((c.tenant_id = t.id))) WHERE ((c.id = course_materials.course_id) AND (t.owner_id = (select auth.uid())))));

-- Table: subscriptions
ALTER POLICY "Admins can manage all subscriptions" ON subscriptions USING (get_user_role((select auth.uid())) = 'admin'::text);
ALTER POLICY "Users can read own subscriptions" ON subscriptions USING ((select auth.uid()) = user_id);
