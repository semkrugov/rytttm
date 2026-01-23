-- ============================================
-- Supabase Schema for Task Tracker Mini App
-- Updated: Chat = Project, Members = Project Members
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, -- project_id = String(message.chat.id)
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'telegram',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: project_members
-- ============================================
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, telegram_user_id)
);

-- ============================================
-- Table: tasks
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  description TEXT,
  telegram_chat_id BIGINT NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  created_by_telegram_user_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_telegram_user_id ON project_members(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_telegram_chat_id ON tasks(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_tasks_telegram_message_id ON tasks(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_telegram_user_id ON tasks(created_by_telegram_user_id);

-- ============================================
-- Function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_project_members_updated_at ON project_members;
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for projects
-- ============================================
DROP POLICY IF EXISTS "Allow anonymous read on projects" ON projects;
CREATE POLICY "Allow anonymous read on projects"
  ON projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on projects" ON projects;
CREATE POLICY "Allow anonymous insert on projects"
  ON projects FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on projects" ON projects;
CREATE POLICY "Allow anonymous update on projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on projects" ON projects;
CREATE POLICY "Allow anonymous delete on projects"
  ON projects FOR DELETE
  USING (true);

-- ============================================
-- RLS Policies for project_members
-- ============================================
DROP POLICY IF EXISTS "Allow anonymous read on project_members" ON project_members;
CREATE POLICY "Allow anonymous read on project_members"
  ON project_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on project_members" ON project_members;
CREATE POLICY "Allow anonymous insert on project_members"
  ON project_members FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on project_members" ON project_members;
CREATE POLICY "Allow anonymous update on project_members"
  ON project_members FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on project_members" ON project_members;
CREATE POLICY "Allow anonymous delete on project_members"
  ON project_members FOR DELETE
  USING (true);

-- ============================================
-- RLS Policies for tasks
-- ============================================
DROP POLICY IF EXISTS "Allow anonymous read on tasks" ON tasks;
CREATE POLICY "Allow anonymous read on tasks"
  ON tasks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on tasks" ON tasks;
CREATE POLICY "Allow anonymous insert on tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on tasks" ON tasks;
CREATE POLICY "Allow anonymous update on tasks"
  ON tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on tasks" ON tasks;
CREATE POLICY "Allow anonymous delete on tasks"
  ON tasks FOR DELETE
  USING (true);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE projects IS 'Projects (Telegram chats/groups). id = String(chat.id)';
COMMENT ON TABLE project_members IS 'Project members (Telegram users)';
COMMENT ON TABLE tasks IS 'Tasks extracted from Telegram messages by AI';
