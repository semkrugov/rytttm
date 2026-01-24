-- ============================================
-- Migration: Add position field to profiles table
-- ============================================

-- Add position column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS position TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.position IS 'User position/job title';
