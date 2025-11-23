-- Update bookings table schema to match createBooking.js INSERT statement
-- This script adds missing columns without dropping existing data

-- Ensure bookings table exists (create if it doesn't)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY
);

-- Text fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tour TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS addons TEXT;

-- Integer fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS people INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price INTEGER;

-- Timestamp field
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Verify the schema matches
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

