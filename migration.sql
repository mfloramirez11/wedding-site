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
