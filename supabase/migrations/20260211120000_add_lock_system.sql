
-- Add is_super_admin column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES users(id)
);

-- Insert default lock date (default: far future to keep it locked initially, e.g., 2026-05-20)
INSERT INTO system_settings (key, value)
VALUES ('message_unlock_date', '2026-05-20T00:00:00Z')
ON CONFLICT (key) DO NOTHING;

-- Update the 3 Super Admins
UPDATE users 
SET is_super_admin = TRUE 
WHERE username IN ('mohammad.nur', 'muhammad.afdal', 'ahmad.naufal');
