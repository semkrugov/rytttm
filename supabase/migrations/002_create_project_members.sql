-- ============================================
-- Migration: Create project_members table
-- ============================================

-- Drop existing table if it exists (to recreate with new structure)
DROP TABLE IF EXISTS project_members CASCADE;

-- Create project_members table with composite primary key
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow anonymous read and insert (same as other tables)
DROP POLICY IF EXISTS "Allow anonymous read on project_members" ON project_members;
CREATE POLICY "Allow anonymous read on project_members"
  ON project_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on project_members" ON project_members;
CREATE POLICY "Allow anonymous insert on project_members"
  ON project_members FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE project_members IS 'Project members linking projects to user profiles';
