const fs = require('fs');

const data = fs.readFileSync('C:\\\\Users\\\\fferr\\\\.gemini\\\\antigravity\\\\brain\\\\542464e7-a17f-4ace-99ad-dc9cdc5a90f5\\\\.system_generated\\\\steps\\\\1076\\\\output.txt', 'utf8');
const match = data.match(/\\[.*\\]/s);
const policies = JSON.parse(match[0]);


let sql = `-- Performance Optimization Migration

-- 1. Unused Indexes (DROP)
DROP INDEX IF EXISTS idx_lesson_views_lesson_id;
DROP INDEX IF EXISTS idx_lesson_views_created_at;
DROP INDEX IF EXISTS idx_courses_is_promoted;

-- 2. Unindexed Foreign Keys (CREATE INDEX)
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

-- 3. RLS Auth Initialization Plan (Wrap auth.uid() in select)
`;

for (const p of policies) {
    if (!p.qual && !p.with_check) continue;

    let qual = p.qual ? p.qual.replace(/auth\\.uid\(\)/g, '(select auth.uid())') : null;
    let with_check = p.with_check ? p.with_check.replace(/auth\\.uid\(\)/g, '(select auth.uid())') : null;

    if (qual === p.qual && with_check === p.with_check) continue; // No change needed

    sql += `ALTER POLICY "${p.policyname}" ON ${p.tablename} `;

    // Postgres ALTER POLICY does not allow changing roles or cmd, just USING and WITH CHECK.
    // If we only have 'qual' (USING), we emit USING
    if (qual) sql += `USING ${qual} `;
    if (with_check) sql += `WITH CHECK ${with_check}`;

    sql += ';\n';
}

fs.writeFileSync('d:\\\\antigravity\\\\xpace-on\\\\web\\\\supabase-scripts\\\\fix-performance-advisors.sql', sql);
console.log('SQL generated successfully.');
