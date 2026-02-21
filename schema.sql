-- Wedding RSVP Database Schema
-- Run this in your Vercel Postgres dashboard after creating the database

CREATE TABLE IF NOT EXISTS rsvps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  attending VARCHAR(10) NOT NULL CHECK (attending IN ('yes', 'no')),
  guests INTEGER NOT NULL CHECK (guests >= 1 AND guests <= 10),
  dietary TEXT,
  allergies TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(LOWER(email));

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);


-- ============================================================
-- Baby Shower RSVP Table (June 7, 2026)
-- ============================================================
CREATE TABLE IF NOT EXISTS baby_shower_rsvps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  attending VARCHAR(10) NOT NULL CHECK (attending IN ('yes', 'no')),
  guests INTEGER NOT NULL DEFAULT 0 CHECK (guests >= 0 AND guests <= 10),
  guest_names TEXT,   -- JSON array: [{name, dietary, allergies}]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for baby shower table
CREATE INDEX IF NOT EXISTS idx_bs_rsvps_email ON baby_shower_rsvps(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_bs_rsvps_created_at ON baby_shower_rsvps(created_at DESC);
