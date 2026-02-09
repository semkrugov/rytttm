-- ============================================
-- Migration: Fix RLS for tasks to allow anonymous insert
-- ============================================

-- Since we are using custom Telegram Auth and not signing in to Supabase Auth,
-- the current user is 'anon' (public). We need to allow insert for public role.

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;

-- Allow insert for everyone (public)
CREATE POLICY "Enable insert for all users" ON tasks FOR INSERT TO public WITH CHECK (true);

-- Ensure other policies are also open to public (just in case)
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Enable update for all users" ON tasks;
CREATE POLICY "Enable update for all users" ON tasks FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON tasks;
CREATE POLICY "Enable delete for all users" ON tasks FOR DELETE TO public USING (true);
