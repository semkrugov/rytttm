-- ============================================
-- Supabase Schema for Task Tracker Mini App
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: profiles
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: projects
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_chat_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: tasks
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deadline TIMESTAMP WITH TIME ZONE,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  time_tracking INTEGER DEFAULT 0, -- время в секундах
  is_tracking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for better performance
-- ============================================
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX idx_projects_telegram_chat_id ON projects(telegram_chat_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

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
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for profiles
-- ============================================
-- Allow anonymous read access
CREATE POLICY "Allow anonymous read on profiles"
  ON profiles FOR SELECT
  USING (true);

-- Allow anonymous insert
CREATE POLICY "Allow anonymous insert on profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Allow anonymous update
CREATE POLICY "Allow anonymous update on profiles"
  ON profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anonymous delete
CREATE POLICY "Allow anonymous delete on profiles"
  ON profiles FOR DELETE
  USING (true);

-- ============================================
-- RLS Policies for projects
-- ============================================
-- Allow anonymous read access
CREATE POLICY "Allow anonymous read on projects"
  ON projects FOR SELECT
  USING (true);

-- Allow anonymous insert
CREATE POLICY "Allow anonymous insert on projects"
  ON projects FOR INSERT
  WITH CHECK (true);

-- Allow anonymous update
CREATE POLICY "Allow anonymous update on projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anonymous delete
CREATE POLICY "Allow anonymous delete on projects"
  ON projects FOR DELETE
  USING (true);

-- ============================================
-- RLS Policies for tasks
-- ============================================
-- Allow anonymous read access
CREATE POLICY "Allow anonymous read on tasks"
  ON tasks FOR SELECT
  USING (true);

-- Allow anonymous insert
CREATE POLICY "Allow anonymous insert on tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

-- Allow anonymous update
CREATE POLICY "Allow anonymous update on tasks"
  ON tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anonymous delete
CREATE POLICY "Allow anonymous delete on tasks"
  ON tasks FOR DELETE
  USING (true);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE profiles IS 'User profiles linked to Telegram accounts';
COMMENT ON TABLE projects IS 'Projects (Telegram chats/groups)';
COMMENT ON TABLE tasks IS 'Tasks extracted from chats by AI or created manually';

COMMENT ON COLUMN tasks.confidence_score IS 'AI confidence score (0-100) for extracted tasks';
COMMENT ON COLUMN tasks.time_tracking IS 'Time tracked in seconds';
COMMENT ON COLUMN tasks.is_tracking IS 'Whether time tracking is currently active';
