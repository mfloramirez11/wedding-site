-- Migration to add dietary and allergies fields to existing rsvps table
-- Run this if you already created the table with the old schema

ALTER TABLE rsvps
  ADD COLUMN IF NOT EXISTS dietary TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT;

-- Update phone and guests to be required (optional, for future records)
-- Note: This won't affect existing NULL values, only new inserts
ALTER TABLE rsvps
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN guests SET NOT NULL;


-- ============================================================
-- Migration: Add baby_shower_rsvps table (run once)
-- ============================================================
CREATE TABLE IF NOT EXISTS baby_shower_rsvps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  attending VARCHAR(10) NOT NULL CHECK (attending IN ('yes', 'no')),
  guests INTEGER NOT NULL DEFAULT 0 CHECK (guests >= 0 AND guests <= 10),
  guest_names TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bs_rsvps_email ON baby_shower_rsvps(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_bs_rsvps_created_at ON baby_shower_rsvps(created_at DESC);
