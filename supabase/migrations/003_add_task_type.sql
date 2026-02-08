ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT CHECK (task_type IN ('urgent', 'discuss', 'wait', 'fix', 'idea'));
COMMENT ON COLUMN tasks.task_type IS 'Task type/tag: urgent, discuss, wait, fix, idea';
