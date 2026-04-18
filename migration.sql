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


-- ============================================================
-- Migration: Seating Chart table (run once)
-- ============================================================
CREATE TABLE IF NOT EXISTS seating_chart (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL,
  table_label VARCHAR(100),
  seat_name VARCHAR(255) NOT NULL,
  rsvp_id INTEGER REFERENCES rsvps(id) ON DELETE SET NULL,
  seat_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_seating_table ON seating_chart(table_number, seat_order);

-- Seed initial seating data — 6 tables, up to 8 people each (edit via admin as needed)
INSERT INTO seating_chart (table_number, table_label, seat_name, seat_order) VALUES
  (1, 'Family',       'Tierra',          0),
  (1, 'Family',       'Hsia',            1),
  (1, 'Family',       'Miguel',          2),
  (1, 'Family',       'Miguel',          3),
  (1, 'Family',       'Jubita',          4),
  (1, 'Family',       'Tia Abuela',      5),

  (2, 'Family #2',    'Selena',          0),
  (2, 'Family #2',    'Daniel',          1),
  (2, 'Family #2',    'Jason',           2),
  (2, 'Family #2',    'Isis',            3),
  (2, 'Family #2',    'Michelle',        4),
  (2, 'Family #2',    'Gary',            5),

  (3, '',             'Claudia Rosales', 0),
  (3, '',             'Javier Moran',    1),
  (3, '',             'Carla Moran',     2),
  (3, '',             'Yareli Moran',    3),
  (3, '',             'Rosario Moran',   4),

  (4, '',             'Charissa',        0),
  (4, '',             'Thomas',          1),
  (4, '',             'Abbin',           2),
  (4, '',             'Rogelio',         3),
  (4, '',             'Josue',           4),
  (4, '',             'Karla',           5),

  (5, '',             'Becky',           0),
  (5, '',             'Lolosang',        1),
  (5, '',             'Tara',            2),
  (5, '',             'Sonya',           3),
  (5, '',             'Nangsa',          4),
  (5, '',             'Rinpoche',        5),

  (6, 'Chung Family', 'Ivy Chung',       0),
  (6, 'Chung Family', 'Peter Chung',     1),
  (6, 'Chung Family', 'Leo Chung',       2),
  (6, 'Chung Family', 'Daniela',         3),
  (6, 'Chung Family', 'Elva',            4),
  (6, 'Chung Family', 'Ramon',           5)
ON CONFLICT DO NOTHING;


-- ============================================================
-- Migration: Final thank you email tracking
-- ============================================================
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS final_thankyou_sent_at TIMESTAMP;
