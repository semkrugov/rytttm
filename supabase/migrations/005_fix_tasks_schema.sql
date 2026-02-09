-- ============================================
-- Migration: Fix tasks table schema for Web App
-- ============================================

-- 1. Make Telegram-specific fields nullable (since Web App tasks don't have them)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'telegram_chat_id') THEN
        ALTER TABLE tasks ALTER COLUMN telegram_chat_id DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'telegram_message_id') THEN
        ALTER TABLE tasks ALTER COLUMN telegram_message_id DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by_telegram_user_id') THEN
        ALTER TABLE tasks ALTER COLUMN created_by_telegram_user_id DROP NOT NULL;
    END IF;
END $$;

-- 2. Add creator_id and assignee_id links to profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'creator_id') THEN
        ALTER TABLE tasks ADD COLUMN creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        CREATE INDEX idx_tasks_creator_id ON tasks(creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assignee_id') THEN
        ALTER TABLE tasks ADD COLUMN assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
    END IF;
END $$;

-- 3. Add tracking fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_tracking') THEN
        ALTER TABLE tasks ADD COLUMN is_tracking BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'time_tracking') THEN
        ALTER TABLE tasks ADD COLUMN time_tracking INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Ensure RLS allows insert
-- (Existing policies might assume logged in user)
-- Update policies to allow authenticated users to create tasks
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
CREATE POLICY "Enable insert for authenticated users only" ON tasks FOR INSERT TO authenticated WITH CHECK (true);

-- Allow reading all tasks (or scope to project members ideally, but keeping it simple for now as per schema.sql)
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);

-- Allow update
DROP POLICY IF EXISTS "Enable update for all users" ON tasks;
CREATE POLICY "Enable update for all users" ON tasks FOR UPDATE USING (true);

-- Allow delete
DROP POLICY IF EXISTS "Enable delete for all users" ON tasks;
CREATE POLICY "Enable delete for all users" ON tasks FOR DELETE USING (true);
