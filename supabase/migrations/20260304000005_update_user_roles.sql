
-- Update Role Column
-- Update Super Admins to ADMINISTRATOR
UPDATE users 
SET role = 'ADMINISTRATOR' 
WHERE is_super_admin = TRUE;

-- Update specific users to EDITOR (Ahmad Naufal Satrio, Muhammad Afdal)
UPDATE users 
SET role = 'EDITOR' 
WHERE name IN ('Ahmad Naufal Satrio', 'Muhammad Afdal');

-- Update remaining ADMINs (Class Admins) to AUTHOR
UPDATE users 
SET role = 'AUTHOR' 
WHERE role = 'ADMIN' AND is_super_admin = FALSE;

-- Update remaining USERs to SUBSCRIBER
UPDATE users 
SET role = 'SUBSCRIBER' 
WHERE role = 'USER';

-- Special case: You (Mohammad Nur Hadi Maulana) should be ADMINISTRATOR
UPDATE users 
SET role = 'ADMINISTRATOR' 
WHERE name = 'Mohammad Nur Hadi Maulana';

-- Special case: TJKT 2 Admins (KEYSHAFANA AYODYA PUTRI DEWITYA, VIVI NUR HIDAYAH) to AUTHOR
UPDATE users 
SET role = 'AUTHOR' 
WHERE name IN ('KEYSHAFANA AYODYA PUTRI DEWITYA', 'VIVI NUR HIDAYAH');

-- Add 'view_as_class_id' column to users table for Administrators to switch views
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS view_as_class_id UUID REFERENCES classes(id);
