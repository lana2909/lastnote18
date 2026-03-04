
-- Add message_id column to submission_tracker table
ALTER TABLE submission_tracker 
ADD COLUMN IF NOT EXISTS message_id uuid REFERENCES messages(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tracker_message ON submission_tracker(message_id);
