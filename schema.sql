-- Wedding RSVP Database Schema
-- Run this in your Vercel Postgres dashboard after creating the database

CREATE TABLE IF NOT EXISTS rsvps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  attending VARCHAR(10) NOT NULL CHECK (attending IN ('yes', 'no')),
  guests INTEGER DEFAULT 1 CHECK (guests >= 1 AND guests <= 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(LOWER(email));

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);
