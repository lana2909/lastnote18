
-- 1. Alter Enum Type to add new roles
-- These must be committed before use
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMINISTRATOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'AUTHOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUBSCRIBER';
