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
  event VARCHAR(20) DEFAULT 'pinole',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for baby shower table
CREATE INDEX IF NOT EXISTS idx_bs_rsvps_email ON baby_shower_rsvps(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_bs_rsvps_created_at ON baby_shower_rsvps(created_at DESC);


-- ============================================================
-- LA Baby Shower RSVP Table (Spanish / English)
-- ============================================================
CREATE TABLE IF NOT EXISTS spanish_rsvps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  attending VARCHAR(10) CHECK (attending IN ('yes', 'no')),
  guests INTEGER DEFAULT 0 CHECK (guests >= 0 AND guests <= 10),
  guest_names TEXT,   -- JSON array: [{name, dietary, allergies}]
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for LA baby shower table
CREATE INDEX IF NOT EXISTS idx_spanish_rsvps_email ON spanish_rsvps(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_spanish_rsvps_created_at ON spanish_rsvps(created_at DESC);
