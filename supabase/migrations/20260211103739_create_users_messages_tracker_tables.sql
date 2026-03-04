/*
  # Create One Last Note Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text) - Full name of the student
      - `username` (text, unique) - Login username
      - `password` (text) - Bcrypt hashed password
      - `role` (text) - Either 'ADMIN' or 'USER'
      - `is_unlocked` (boolean) - True when user has sent all 35 messages
      - `created_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `recipient_id` (uuid, foreign key to users)
      - `kesan` (text) - Impression message
      - `pesan` (text) - General message
      - `larangan` (text) - Things to avoid (3+ items)
      - `sifat` (text) - Good traits to maintain (3+ items)
      - `kesimpulan` (text) - Summary in one sentence
      - `hal_terpendam` (text) - Things always wanted to say
      - `momen_berkesan` (text) - Most memorable moment
      - `created_at` (timestamptz)
      
      Note: NO sender information stored for complete anonymity
    
    - `submission_tracker`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `recipient_id` (uuid) - Just an ID, not foreign key to prevent tracking
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, recipient_id) to prevent duplicates

  2. Security
    - Enable RLS on all tables
    - Users can read their own user record
    - Users can read messages where they are the recipient (only if unlocked)
    - Users can insert messages and tracker entries
    - Admins can read all messages (but still no sender info)
    - Users can read other users' basic info (name, id) for the classmate list
*/

-- Create enum type for role
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  is_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kesan text NOT NULL,
  pesan text NOT NULL,
  larangan text NOT NULL,
  sifat text NOT NULL,
  kesimpulan text NOT NULL,
  hal_terpendam text NOT NULL,
  momen_berkesan text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create submission_tracker table
CREATE TABLE IF NOT EXISTS submission_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipient_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_tracker_user ON submission_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_tracker ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table

-- Users can read all user records (needed for classmate list)
CREATE POLICY "Users can view all user profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own unlock status
CREATE POLICY "Users can update their own unlock status"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for messages table

-- Users can insert messages
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can only read messages addressed to them and only if unlocked
CREATE POLICY "Unlocked users can read their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_unlocked = true
    )
  );

-- Admins can read all messages
CREATE POLICY "Admins can read all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for submission_tracker table

-- Users can insert their own tracker entries
CREATE POLICY "Users can create tracker entries"
  ON submission_tracker FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own tracker entries
CREATE POLICY "Users can read own tracker entries"
  ON submission_tracker FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all tracker entries
CREATE POLICY "Admins can read all tracker entries"
  ON submission_tracker FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );